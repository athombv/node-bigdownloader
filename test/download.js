"use strict";
var path			= require('path');
var BigDownloader 	= require('..');

var downloader = new BigDownloader({
	url		: 'http://www.colocenter.nl/speedtest/1000mb.bin',
	path	: '1000mb.bin',
	hash	: '00f5c773ce410ef6705a3c5a1aedbc923085c181',
	size	: 1048576000, // if not given, extract size from headers
	debug	: true
})

downloader
	.on('start', function(){
		console.log('onStart');
	})
	.on('error', function(err){
		console.log('onError', err);
	})
	.on('progress', function(progress){
		console.log();
		console.log('total', progress.total);
		console.log('done', progress.done);
		console.log('percent', progress.percent);
	})
	.on('finish', function(){
		console.log('onFinish');
	})
	.start()