global.electron = require('electron');
global.app = electron.app;
global.ipcMain = electron.ipcMain;

global.co = require('co');
global.fetch = require('node-fetch');
global.through2 = require('through2');
global.JSZip = require("jszip");

global.tools = require('./tools');
global.files = require('./files');
global.downloader = require('./downloader');