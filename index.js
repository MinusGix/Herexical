const bignum = require('bignum');
require('dotenv').config();

const Log = require('./src/Log.js');
const Err = require('./src/Error.js');
const FileWrap = require('./src/FileWrap.js');
const BufferWrap = require('./src/BufferWrap.js');
const EditStorage = require('./src/EditStorage.js');
const View = require('./src/View.js');

module.exports = {
	bignum,
	Err,
	FileWrap,
	BufferWrap,
	EditStorage,
	View,
};

Log.info('Index.js finished.');