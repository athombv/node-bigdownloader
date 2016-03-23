# node-bigdownloader

Download big files, with auto resume. This module assumes you know the hash

Example:
```javascript
"use strict";
var path			= require('path');
var BigDownloader 	= require('./BigDownloader.js');

var downloader = new BigDownloader({
	url		: 'https://path.com/to/a/very/large/file',
	path	: '/tmp/out.tar.gz',
	hash	: 'be8544f91c22e859e6b330e6875b5f87ae41b33c',
	size	: 144858835, // if not given, extract size from headers
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
		console.log(progress.total);
		console.log(progress.done);
		console.log(progress.percent);
	})
	.on('finish', function(){
		console.log('onFinish');
	})
	.start()
```
