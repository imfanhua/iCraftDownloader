const fs = require('fs');
const EventEmitter = require('events');

const empty = (response, object) => {};
const file = (file) => (stream) => stream.pipe(fs.createWriteStream(file));

const tryDownloads = (times) => (url, to, pre) => {
	let object = new EventEmitter();

	object.max = times;
	object.now = 0;
	object.success = false;
	object.done = false;

	object.close = () => {
		if (object.closed) return;
		object.closed = true;
		if (object._closeable) {
			object._closeable.close();
			object._closeable = null;
		}

		object.done = true;
		object.emit('done', object);
	};

	setImmediate(() => tryDownload(object, url, to, pre));
	return object;
};

const tryDownload = (object, url, to, pre) => {
	if (object.closed) return;
	delete object.downloaded;
	delete object.size;
	delete object.progress;
	object._closeable = null;

	object.emit('try', object);
	let downloader = download(url, to, pre);
	object._closeable = downloader;
	downloader.on('start', () => {
		if (object.closed) return;
		object.size = downloader.size;
		object.downloaded = 0;
		object.emit('start', object);
	});
	downloader.on('updated', () => {
		if (object.closed) return;
		object.downloaded = downloader.downloaded;
		object.progress = downloader.progress;
		object.emit('updated', object);
	});
	downloader.on('done', () => {
		if (object.closed) return;
		if (!downloader.success) {
			if (object.now++ >= object.max) {
				object.success = false;
				object.done = true;
				object.emit('done', object);
			} else tryDownload(object, url, to, pre);
		} else {
			object.success = true;
			object.done = true;
			object.emit('done', object);
		}
	});
};

const download = (url, to, pre) => {
	if (typeof to === 'string') to = file(to);
	if (!pre) pre = empty;
	let object = new EventEmitter();

	object.close = () => {
		if (object.closed) return;
		object.closed = true;
		if (object._closeable) {
			object._closeable.close();
			object._closeable = null;
		}

		object.done = true;
		object.emit('done', object);
	};

	setImmediate(() => {
		co(function *() {
			if (object.closed) return false;
			let response = yield fetch(url);
			if (object.closed) return false;
			if (response.status !== 200) throw new Error(`Network error... (Status: ${response.status})`);

			object.success = false;
			object.done = false;
			object.downloaded = 0;
			object.size = parseInt(response.headers.get('content-length'));
			pre(response, object);
			if (!object.size || object.size < 0) object.size = NaN;
			object.progress = !object.size ? 0 : NaN;

			object.emit('start');
			if (object.closed) return false;

			let stream = response.body.pipe(through2(
				(chunk, encoding, callback) => {
					object.downloaded += chunk.length;
					if (object.size) object.progress = Math.floor((object.downloaded / object.size) * 100);
					object.emit('updated', object);
					callback(null, chunk)
				},
				(callback) => {
					object.success = true;
					callback();
				}
			));

			object._closeable = to(stream).on('close', () => {
				if (object.closed) return;
				object.closed = true;
				object._closeable = null;
				object.done = true;
				object.emit('done', object);
			});
		}).catch(error => {
			try {
				object.emit('error', error);

				object.close();
			} catch(error) {}
		});
	});

	return object;
};

module.exports = {
	download: download,
	try: tryDownloads
};