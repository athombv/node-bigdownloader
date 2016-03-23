"use strict";
var path			= require('path');
var BigDownloader 	= require('..');

var downloader = new BigDownloader({
	url		: 'http://www.colocenter.nl/speedtest/50mb.bin',
	path	: '50mb.bin',
	hash	: '1648df576e9b8ad247bfb38fef010aa683e274fc',
	//size	: 1048576000, // if not given, extract size from headers
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