const EventEmitter = require('events');

const tasks = require('./tasks');
const curse = require('./curse');

let modpacks = [];
let events = new EventEmitter();

const tryInfo = (id, file) => co(function* () {
	try {
		return yield curse.info(id, file);
	} catch (error) {}

	try {
		return yield curse.info(id, file);
	} catch (error) {}

	try {
		return yield curse.info(id, file);
	} catch (error) {
		throw error;
	}
});

const startTask = (id, file) => tryInfo(id, file).then(info => task(id, file, info));

const task = (id, file, info) => {
	tasks.create(id, file, curse.download(id, file))
	.then(object => events.emit('task:add', object.id, { id, file, info }))
	.on('updated', (object, download) => events.emit('task:update', object.id, download.progress))
	.on('done', (object, success) => {
		events.emit('task:update', object.id, 100);

		if (success) {
			tasks.writeInfo(id, file, info);
			checkFile(object.to)
			.then(mods => {
				events.emit('task:done', object.id, !mods);
				if (mods) modpacks.push({id: id, file: file, fullID: object.id, info: info, mods: mods});

				checkPacks();
			});
		}
	});
};

const checkFile = (file) =>
	tools
	.readZip(file)
	.then(zip => {
		let manifest = zip.file('manifest.json');
		if (!manifest) throw new Error('Manifest not found');

		return manifest.async("string").then(data => {
			data = JSON.parse(data);

			let mods = [];
			let now = 0;
			let next = 500;
			for (let file of data.files) {
				let mod = { id: file.projectID, file: file.fileID };
				mods.push(mod);
				if (!tasks.exists(mod.id, mod.file)) startWhen(now++ * next, mod.id, mod.file);
			}

			return Promise.resolve(mods);
		});
	})
	.catch(error => events.emit('error', error));

const startWhen = (timeout, id, file) => setTimeout(() => startTask(id, file).catch(error => console.log(error)), timeout);

const checkPacks = () => modpacks = modpacks.filter(checkPack);

const checkPack = (modpack) => {
	for (let mod of modpack.mods) if (!tasks.exists(mod.id, mod.file)) return true;

	tools
	.readZip(tasks.toFile(modpack.id, modpack.file))
	.then(zip => co(function* () {
		let folder = zip.folder('overrides').folder('mods');
		for (let mod of modpack.mods) {
			let info = tasks.getInfo(mod.id, mod.file);
			let target = tasks.toFile(mod.id, mod.file);
			yield tools.writeToZip(folder, target, info.file);
		}

		modpack.path = files.packs.file(tasks.fullID(modpack.id, modpack.file));
		yield tools.writeZip(zip, modpack.path);
	}))
	.then(() => events.emit('pack:done', modpack))
	.catch(error => events.emit('error', error));
	return false;
};

events.start = (url) => new Promise((resolve, reject) => {
	curse
	.parse(url)
	.then(data => {
		resolve();
		startTask(data.id, data.file);
	})
	.catch(error => {
		switch ((error || {}).id || -999) {
			case -1:
				reject('指定目标无效或网络错误');
				break;
			case -2:
				reject('无法获取指定目标的最新版本文件或网络错误');
				break;
			case -3:
				reject('无法加载文件信息');
				break;
		}
	});
});

module.exports = events;