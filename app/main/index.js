require('./requires');

const fs = require('fs');

files.init();

const window = require('./windows');

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
.on('task:done', (id, mod) => window.send(mod ? 'task:remove' : 'task:hide', id))
.on('pack:done', modpack => {
	window.send('task:remove', modpack.fullID);
	window.send('done', '完成', `整合包 [${modpack.info.title}] 已经处理完成~`);
	window.send('item:add', {
		image: modpack.info.image,
		name: `${modpack.info.title} (${modpack.info.file})`,
		file: files.packs.file(modpack.id, modpack.file),
		filename: modpack.info.file,
	});
});

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
