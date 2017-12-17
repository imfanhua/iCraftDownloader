require('./requires');

const fs = require('fs');

const window = require('./windows');
if (app.makeSingleInstance(() => window.focus())) return app.quit();

files.init();

app.on('window-all-closed', () => app.quit());
app.on('quit', () => files.init());

let settings = require('./settings');

ipcMain.on("view-settings", () => window.send('settings', settings.settings));
ipcMain.on("view-settings-save", (event, args) => settings.save(args));

const modpacks = require('./modpacks');

modpacks
.on('task:add', (id, task) => {
	window.send('task:add', id, {
		image: task.info.image,
		name: `${task.info.title} (${task.info.file})`,
		progress: 0,
	});
})
.on('task:update', (id, progress) => window.send('task:update', id, progress))
.on('task:done:mod', id => window.send('task:remove', id))
.on('task:done:modpack', id => window.send('task:hide', id))
.on('pack:done', modpack => {
	window.send('task:remove', modpack.fullID);
	window.send('done', '完成', `整合包 [${modpack.info.title}] 已处理完成~`);
	window.send('item:add', {
		image: modpack.info.image,
		name: modpack.info.title,
		file: modpack.path,
		filename: modpack.info.file,
		button: true,
	});
}).on('error', error => console.log(error));

ipcMain.on("view-download", (event, arg) => {
	window.send('info', "开始分析目标");
	modpacks.start(arg).then(() => window.send('success', '找到目标, 开始处理')).catch(error => window.send('error', error));
});

ipcMain.on("view-drag", (event, arg) => {
	try {
		let file = files.dragging.file(arg.filename);
		if (!fs.existsSync(file)) fs.writeFileSync(file, fs.readFileSync(arg.file));
		event.sender.startDrag({ file, icon: files.views.icons.file });
	} catch (error) {
		console.log(error);
	}
});

const converts = require('./converts');

ipcMain.on("view-clicked", (event, arg) => {
	window.send('success', `开始转换整合包 [${arg.name}] 至 [MultiMC] 格式`);

	converts.convert(arg.file, converts.MultiMC)
	.then(path => {
		window.send('done', '完成', `整合包 [${arg.name}] 已成功转换为 [MultiMC] 格式~`);
		arg.name += ' [MultiMC]';
		arg.file = path;
		arg.filename = arg.filename.substring(0, arg.filename.length - 4) + "-multimc.zip";
		arg.button = false;
		window.send('item:add', arg);
	})
	.catch(error => console.log(error));
});