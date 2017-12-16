const url = require('url');
const BrowserWindow = electron.BrowserWindow;

let window;
app.once('ready', () => {
	window = new BrowserWindow({ width: 800, height: 600, icon: files.views.icons.icon.platform() });
	window.setMenu(null);

	window.loadURL(url.format({
		pathname: files.views.index,
		protocol: 'file:',
		slashes: true
	}));

	window.on('closed', () => window = null);
});

const sendMessage = (...args) => {
	if (window != null) window.webContents.send(...args);
};

const focus = () => {
	if (window == null) return;
	if (window.isMinimized()) window.restore();
	window.focus();
};

module.exports = { focus, send: sendMessage };