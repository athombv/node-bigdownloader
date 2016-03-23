"use strict";

var fs		= require('fs');
var path	= require('path');
var util	= require('util');
var events	= require('events');
var crypto	= require('crypto');

//var jswget 	= require('jswget');
var request	= require('request');

function BigDownloader( opts ) {

	this.opts = util._extend({
		url					: undefined,
		path				: undefined,
		size				: undefined,
		hash				: undefined,
		progressInterval	: 1000,
		debug				: false
	}, opts);

	this.debug = function(){
		if( this.opts.debug ) {
			console.log.apply( null, arguments);
		}
	}.bind(this);

	this.size = undefined;
	this.progressInterval = undefined;

	this.download = function( retry ){
		this.debug('this.download', 'retry:', retry === true)

		var requestOpts = {
			url: this.opts.url,
		}

		try {
			var stats = fs.statSync(this.opts.path);
			requestOpts.headers = {
				'range': 'bytes=' + stats.size.toString() + '-'
			}
		} catch(e){}

		var writeStream = fs.createWriteStream( this.opts.path, { flags: 'a+' } );

		function errCallback(err){
			this.debug(err);
			this.download( true );
		}

		request(requestOpts)

			.on('error', errCallback.bind(this))
			.on('response', function(response) {
			    if( retry ) return;

				if( response.headers['content-length'] ) {
					this.size = parseInt(response.headers['content-length']);
					this.debug('got size from headers', this.size);
				}

				if( this.progressInterval ) clearInterval(this.progressInterval);
		        this.progressInterval = setInterval(function(){

					fs.stat( this.opts.path, function(err, stats){
						if( err ) return this.debug(err);

						var total = this.opts.size || this.size;
						var done = stats.size;
						var percent = done / total;

				        this.emit('progress', {
					        total	: total,
					        done	: done,
					        percent	: percent
				        })

					}.bind(this));

				}.bind(this), this.opts.progressInterval);

			}.bind(this))

			.pipe( writeStream )
			.on('error', errCallback.bind(this))
			.on('finish', function(){
				this.debug('onFinish');

		        if( this.progressInterval ) clearInterval(this.progressInterval);

		        if( typeof this.opts.size == 'number' ) {
					var stats = fs.statSync( this.opts.path );
					if( stats.size < this.opts.size ) {
						this.debug('downloaded file too small, continuing...');
						return this.download( true );
					}
			    } else if( typeof this.size == 'number' ) {
					var stats = fs.statSync( this.opts.path );
					if( stats.size < this.size ) {
						this.debug('downloaded file too small, continuing...');
						return this.download( true );
					}
			    }

			    if( typeof this.opts.hash == 'string' ) {
				    var hasher = crypto.createHash('sha1');
					    hasher.setEncoding('hex');

					var reader = fs.createReadStream( this.opts.path );
						reader.pipe( hasher );
						reader.on('end', function(){
							hasher.end();
							var hash = hasher.read();
							this.debug('calculated hash:', hash)

							if( hash == this.opts.hash ) {
								this.emit('finish');
							} else {
								this.debug('invalid_checksum');
								this.emit('error', new Error("invalid_checksum"));
							}
						}.bind(this))
			    } else {
		        	this.emit('finish');
		        }

			}.bind(this))

	}.bind(this);

	this.start = function(){
		this.download();
	}.bind(this);

}

var EventEmitter = events.EventEmitter;
util.inherits( BigDownloader, EventEmitter );

module.exports = BigDownloader;