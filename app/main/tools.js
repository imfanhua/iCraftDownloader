const fs = require('fs');

String.prototype.getMid = function(start, end) {
	let self = this.valueOf();
	let index = self.indexOf(start);
	if (index === -1) return null;
	index += start.length;
	let endIndex = self.indexOf(end, index);
	return endIndex === -1 ? null : self.substring(index, endIndex);
};

const writeZip = (zip, to) => new Promise(
	(resolve, reject) => {
		let error = false;

		zip
		.generateNodeStream({ type: 'nodebuffer',streamFiles: true })
		.pipe(fs.createWriteStream(to))
		.on('error', err => error = err)
		.on('close', () => error ? reject(error) : resolve(to));
	}
);

const readZip = (file) => new Promise(
	(resolve, reject) => {
		fs.readFile(file, function(error, data) {
			if (error) return reject(error);
			JSZip.loadAsync(data).then(resolve).catch(reject);
		});
	}
);

const pushZipTo = (targets, to) => co(function *() {
	let list = yield getZipFiles(targets);
	for (let { path, file } of list) to.file(path, yield file.async('nodebuffer'));
});

const writeToZip = (zip, file, path) => new Promise((resolve, reject) => {
	fs.readFile(file, (error, data) => {
		if (error) return reject(error);
		resolve(zip.file(path, data));
	});
});

const getZipFiles = (zip) => new Promise(resolve => {
	let list = [];
	zip.forEach((path, file) => list.push({ path, file }));
	resolve(list);
});

module.exports = { writeZip, readZip, pushZipTo, writeToZip };