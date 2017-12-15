const URL = require('url');

const ID_NOT_FOUND = {message: 'ID not found', id: -1};
const FILE_NOT_FOUND = {message: 'File not found', id: -2};
const INFO_NOT_FOUND = {message: 'File info not found', id: -3};

const info = (id, file) => {
	return fetch(page(id, file))
	.then(res => res.text()).then((data) => {
		let image = getImageURL(data);
		if (!image) image = './libs/imgs/file.png';
		let title = getProjectTitle(data);
		if (!title) return Promise.reject(INFO_NOT_FOUND);
		let file = getFileName(data);
		if (!file) return Promise.reject(INFO_NOT_FOUND);
		return Promise.resolve({
			image,
			title: title.replace(new RegExp('&#x27;', "gm"), "'"),
			file: file.replace(new RegExp('&#x27;', "gm"), "'")
		});
	})
};

const page = (id, file) => `https://minecraft.curseforge.com/projects/${id}/files/${file}`;
const download = (id, file) => `${page(id, file)}/download`;

const parse = (url) => {
	const data = URL.parse(url);
	if (data.host === 'www.curseforge.com') {
		return fetch(`https://www.curseforge.com${data.pathname.replace('download', '')}`)
		.then(res => res.text()).then(getID).then(getLastFileId)
	} else {
		let path = data.pathname + '/';
		let name = path.getMid('projects/', '/');
		if (!name) return Promise.reject(ID_NOT_FOUND);
		let file = path.getMid('files/', '/');
		return fetch(`https://minecraft.curseforge.com/projects/${name}`)
		.then(res => res.text()).then(getID)
		.then(id => !file ? getLastFileId(id) : Promise.resolve({id: id, file: file}))
	}
};

const getLastFileId = (id) =>
	fetch(`https://www.curseforge.com/projects/${id}/files`)
	.then(res => res.text())
	.then(data => {
		let mid = data.getMid('overflow-tip twitch-link', 'data-action=');
		if (!mid) return Promise.reject(FILE_NOT_FOUND);
		mid = mid.getMid('files/', '"');
		return !mid ? Promise.reject(FILE_NOT_FOUND) : Promise.resolve({id: id, file: mid});
	});

const getImageURL = (data) => {
	let mid = data.getMid('e-avatar64 lightbox', '</a>');
	if (!mid) return null;
	return mid.getMid('<img src="', '"');
};

const getProjectTitle = (data) => {
	let mid = data.getMid('project-title', '</a>');
	if (!mid) return null;
	return mid.getMid('overflow-tip">', '</span>');
};

const getFileName = (data) => {
	let mid = data.getMid('Filename</div>', '</li>');
	if (!mid) return null;
	return mid.getMid('overflow-tip">', '</div>');
};

const getID = (data) => {
	let id = getProjectID(data) || getCruseID(data);
	return !id ? Promise.reject(ID_NOT_FOUND) : Promise.resolve(id.trim());
};

const getProjectID = (data) => {
	let mid = data.getMid('Project ID', '</li>');
	if (!mid) return null;
	return mid.getMid('">', '<');
};

const getCruseID = (data) => {
	let mid = data.getMid('ProjectID', 'ProjectName');
	if (!mid) return null;
	return mid.getMid(':', ',');
};

module.exports = { parse, page, download, info };