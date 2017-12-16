const { openExternal } = require('electron').shell;

const app = new Vue({
	el: '#app',
	data: function() {
		return {
			version: 'Beta.1.0.1',
			inputs: {
				visible: false,
				proxy: {
					mode: '0',
					address: '',
					port: 0,
				}
			}, settings: {
				proxy: {
					mode: '0',
					address: '',
					port: 0,
				}
			},
			items: [],
			tasks: [],
			contributors: [
				{
					name: 'FanHua',
					avatar: './libs/imgs/avatar.jpg',
					text: 'i@fanhua.me',
					button: '微博',
					url: 'https://weibo.com/imfanhua',
				}
			],
		}
	},
	methods: {
		handleAddDownload() {
			this.$prompt(' ', '添加下载目标', {
				confirmButtonText: '添加',
				cancelButtonText: '取消',
				inputPlaceholder: '请输入下载目标地址...',
				inputValidator: (value) => value && value.trim().length > 0 ? true : '下载目标地址不能为空...',
			}).then(({ value }) => {
				download(value);
			}).catch(() => {});
		}, handleSettings() {
			if (this.inputs.visible) return;
			let { mode, address, port } = this.settings.proxy;
			this.inputs.proxy = { mode, address, port };
		}, handleSave() {
			this.inputs.visible = false;
			let { mode, address, port } = this.inputs.proxy;
			this.settings.proxy = { mode, address, port };
			saveSettings(this.settings);
		}, handleClick(item) {
			item.button = false;
			clicked(item);
		}, handleDragItem(event, item) {
			event.preventDefault();
			drag(item.file, item.filename);
		}, openURL(url) {
			openExternal(url);
		}
	}
});

document.ondragover = (event) => {
	event.stopPropagation();
	event.preventDefault();
};

document.ondrop = (event) => {
	event.stopPropagation();
	event.preventDefault();
	let transfer = event.dataTransfer;
	if (transfer.types.indexOf('text/uri-list') === -1) return;
	download(transfer.getData('text/uri-list'));
};

const getTask = (id) => {
	for (let task of app.tasks) if (task.id === id) return task;
	let task = {
		id,
		open: true,
		hide: false,
		content: { image: "", name: "", progress: 0 }
	};
	app.tasks.push(task);
	return task;
};

const removeTask = (id) => {
	for (let i = 0; i < app.tasks.length; i++)
		if (app.tasks[i].id === id) {
			app.tasks.splice(i, 1);
			break;
		}
};

const { ipcRenderer } = require('electron');
const download = (target) => ipcRenderer.send("view-download", target);
const drag = (file, filename) => ipcRenderer.send("view-drag", { file, filename });
const clicked = (item) => ipcRenderer.send("view-clicked", item);
const needSettings = () => ipcRenderer.send("view-settings");
const saveSettings = (settings) => ipcRenderer.send("view-settings-save", settings);

ipcRenderer.on("error", (sender, arg) => app.$message.error({message: arg, showClose: true}));
ipcRenderer.on("info", (sender, arg) => app.$message.info({message: arg, showClose: true}));
ipcRenderer.on("success", (sender, arg) => app.$message({message: arg, showClose: true, type: 'success'}));
ipcRenderer.on("done", (sender, title, content) => app.$notify({ title: title, message: content, type: 'success', position: 'bottom-left' }));

ipcRenderer.on("item:add", (sender, item) => app.items.push(item));

ipcRenderer.on("task:add", (sender, arg, task) => getTask(arg).content = task);
ipcRenderer.on("task:hide", (sender, arg) => getTask(arg).hide = true);
ipcRenderer.on("task:update", (sender, arg, progress) => getTask(arg).content.progress = progress);
ipcRenderer.on("task:remove", (sender, arg) => removeTask(arg));

ipcRenderer.on("settings", (sender, arg) => app.settings = arg);
needSettings();