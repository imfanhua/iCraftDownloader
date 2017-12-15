const fs = require('fs');

let settings = {};

const changed = () => {
	if (settings.proxy.mode === '0') {
		// [ Disabled ]
	} else if (settings.proxy.mode === '1') {
		// [ Socks5 ]
		// settings.proxy.address
		// parseInt(settings.proxy.port)
	}
};

const save = (args) => {
	settings = args;
	fs.writeFileSync(files.settings, JSON.stringify(args));

	changed();
};

if (fs.existsSync(files.settings)) {
	settings = JSON.parse(fs.readFileSync(files.settings, 'utf-8'));
	changed();
}

module.exports = { save, settings };