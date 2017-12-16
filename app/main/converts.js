const MultiMC = function *(file, zip, manifest) {
	let to = yield load('MultiMC');

	let notes = `整合包版本: ${manifest.version}`;
	let loaders = manifest.minecraft.modLoaders || [];
	if (loaders.length > 0) {
		notes += '\n您需要手动安装以下模组载入器:';
		for (let loader of loaders) notes += `\n${loader.id}`;
	}

	yield text(to, 'instance.cfg',
		text => text
		.replace('%name%', manifest.name)
		.replace('%version%', manifest.minecraft.version)
		.replace('%notes%', notes.replace(new RegExp('\n', "gm"), "\\n"))
	);

	yield tools.pushZipTo(zip.folder('overrides'), to.folder('minecraft'));
	return yield tools.writeZip(to, `${file}-multimc`);
};

const load = (name) => tools.readZip(files.templates.file(name));
const text = (zip, file, to) => zip.file(file).async("string").then(data => zip.file(file, to(data)));

const convert = (file, converter) => tools
.readZip(file)
.then((zip) => {
	let manifest = zip.file('manifest.json');
	if (!manifest) throw new Error('Manifest not found');
	return manifest.async("string").then(data => co(converter(file, zip, JSON.parse(data))));
});

module.exports = {
	MultiMC,

	convert,
};