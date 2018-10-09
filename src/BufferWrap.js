const FileWrap = require('./FileWrap.js');

class BufferWrap {
	constructor (file) {
		this._file = new FileWrap(file);
	}
}