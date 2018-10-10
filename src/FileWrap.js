const fs = require('fs');
const Err = require('./Error.js');
const BufferWrap = require('./BufferWrap.js');

class FileWrap {
	constructor (fileDir) {
		this._fileDir = fileDir;
		this._loaded = new BufferWrap();
		this.fd = null;

		this.initialized = false;
	}

	get loaded () {
		return this.fd !== null;
	}

	async init () {
		try {
			this.fd = await this._open();
		} catch (err) {
			Err.FatalError(err, "Opening file to retrieve file-descriptor failed.");
		}
		
		this.initialized = true;
	}

	_open () {
		return new Promise((resolve, reject) => fs.open(this._fileDir, 'wr', (err, fd) => {
			if (err) {
				throw err;
			}

			resolve(fd);
		}));
	}

	_loadData (pos, length, fd=null) {
		if (!this.initialized) {
			return Err.FatalError("Attempt to load data without being initialized.");
		}

		if (fd === null) {
			fd = this.fd;
		}

		let buf = new Buffer();

		return new Promise((resolve, reject) => fs.read(fd, buf, 0, length, pos, (err, bytesRead, buffer) => {
			if (err) {
				return reject(err);
			}

			resolve(buffer, bytesRead);
		}));
	}
}

module.exports = FileWrap;