"use strict";

var fs		= require('fs');
var path	= require('path');
var util	= require('util');
var events	= require('events');
var crypto	= require('crypto');

var jswget 	= require('jswget');

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
	
		jswget({
		    url				: this.opts.url,
		    downloadpath	: path.dirname(this.opts.path) + '/',
		    downloadas		: path.basename(this.opts.path),
		    downloadmode	: true,
		    
		    onsend: function(req, options){
			    if( retry ) return;
			    
		        this.emit('start');
		        
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
		    }.bind(this),
		    
		    onhead: function(fstat, req, res){
			    if( retry ) return;
				
				if( res.headers['content-length'] ) {
					this.size = parseInt(res.headers['content-length']);
					this.debug('got size from headers', this.size);
				}
				
		    }.bind(this),
		    
		    onsuccess: function(resp, req, res){
		        
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
		        
		    }.bind(this),
		    
		    onerror: function(err, req){
			    this.debug(err);
			    this.download( true );
		    }.bind(this)
		});
	
	}.bind(this);
	
	this.start = function(){
		this.download();
	}.bind(this);
	
}

var EventEmitter = events.EventEmitter;
util.inherits( BigDownloader, EventEmitter );

module.exports = BigDownloader;