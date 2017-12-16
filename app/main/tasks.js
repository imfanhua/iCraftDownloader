const fs = require('fs');
const EventEmitter = require('events');

const fullID = (id, file) => `${id}-${file}`;

const downloads = {};

const create = (id, file, url) => {
	let object = new EventEmitter();
	object.id = fullID(id, file);
	object.file = files.downloading.file(fullID(id, file));
	object.to = files.caches.file(fullID(id, file));

	let downloading = downloads[object.id];
	if (downloading) return downloading;
	object.then = (callback) => {
		callback(object);
		return object;
	};
	downloads[object.id] = object;

	setImmediate(() => {
		fs.exists(object.to, (exists) => {
			if (exists) object.emit('done', object, true);
			else {
				downloader.try(3)(url, object.file)
				.on('start', target => object.emit('updated', object, target))
				.on('updated', target => object.emit('updated', object, target))
				.on('done', target => {
					if (target.success) fs.renameSync(object.file, object.to);
					else try { fs.unlinkSync(target.file); } catch(error) {}
					object.emit('done', object, target.success);
					delete downloads[object.id];
				});
			}
		});
	});

	return object;
};

const exists = (id, file) => fs.existsSync(files.caches.file(fullID(id, file)));

const getInfo = (id, file) => {
	try {
		return JSON.parse(fs.readFileSync(files.caches.info(fullID(id, file)), 'utf-8'));
	} catch(error) { return false; }
};

const writeInfo = (id, file, info) => {
	try {
		fs.writeFileSync(files.caches.info(fullID(id, file)), JSON.stringify(info));
	} catch(error) { return false; }
};

module.exports = {
	create, exists, getInfo, writeInfo, fullID,
	toFile (id, file) { return files.caches.file(fullID(id, file)); }
};