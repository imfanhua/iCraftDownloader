const fs = require('fs');
const path = require('path');

const files = {
	root: path.join(__dirname, '..', '..'),
	app: path.join(__dirname, '..'),
};

files.caches = {
	root: path.join(files.root, 'caches'),
	file (id) { return path.join(files.caches.root, id); },
	info (id) { return `${files.caches.file(id)}.json`; },
};

files.temp = {
	root: path.join(files.root, 'temp'),
};

files.packs = {
	root: path.join(files.temp.root, 'packs'),
	file (name) { return path.join(files.packs.root, name); },
};

files.dragging = {
	root: path.join(files.temp.root, 'dragging'),
	file (name) { return path.join(files.dragging.root, name); },
};

files.downloading = {
	root: path.join(files.temp.root, 'downloading'),
	file (id) { return path.join(files.downloading.root, id); },
};

files.settings = path.join(files.root, 'settings.json');

files.views = {
	root: path.join(files.app, 'view'),
};

files.views.index = path.join(files.views.root, 'index.html');

files.views.libs = path.join(files.views.root, 'libs');
files.views.imgs = path.join(files.views.libs, 'imgs');

files.views.icons = {
	file: path.join(files.views.imgs, 'file.png'),
	icon: {
		root: path.join(files.views.imgs, 'icons', 'icon'),
		platform () { return files.views.icons.icon[process.platform] || files.views.icons.icon['default']; }
	},
};

files.views.icons.icon['win32'] = files.views.icons.icon.root + '.ico';
files.views.icons.icon['darwin'] = files.views.icons.icon.root + '.png';
files.views.icons.icon['default'] = files.views.icons.icon.root + '.png';

files.main = {
	root: path.join(files.app, 'main'),
};

files.templates = {
	root: path.join(files.main.root, 'templates'),
	file (name) { return path.join(files.templates.root, `${name}.zip`); },
};

files.init = () => {
	files.mkdir(files.caches.root);

	files.mkdir(files.temp.root);
	files.mkdir(files.packs.root);
	files.mkdir(files.dragging.root);
	files.mkdir(files.downloading.root);

	files.clean(files.downloading.root);
	files.clean(files.packs.root);
	files.clean(files.dragging.root);
};

files.mkdir = (path) => {
	if (!fs.existsSync(path)) fs.mkdirSync(path);
};

files.clean = (dir) => {
	let files = fs.readdirSync(dir);
	for (let file of files) {
		file = path.join(dir, file);
		if (fs.statSync(file).isFile()) fs.unlinkSync(file);
	}
};

module.exports = files;