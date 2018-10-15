require('dotenv').config();

const Log = require('./src/Log.js');
const Err = require('./src/Error.js');
const FileWrap = require('./src/FileWrap.js');
const BufferWrap = require('./src/BufferWrap.js');
const EditStorage = require('./src/EditStorage.js');
const View = require('./src/View.js');

module.exports = {
	Err,
	FileWrap,
	BufferWrap,
	EditStorage,
	View,
	Log,
};

Log.info('Index.js finished.');