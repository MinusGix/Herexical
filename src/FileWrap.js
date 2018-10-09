const fs = require('fs');

class FileWrap {
	constructor (fileDir) {
		this._fileDir = fileDir;
		this._loaded = new Buffer();
		this.fd = null;
		
	}

	get loaded () {
		return this.fd !== null;
	}

	init () {
		this._open()
			.then(fd => this.fd = fd);
	}

	_open () {
		return new Promise((resolve, reject) => fs.open(this._fileDir, 'wr', (err, fd) => {
			if (err) {
				throw err;
			}

			resolve(fd);
		}));
	}

	_loadData (fd, pos, length) {
		let buf = new Buffer();

		return new Promise((resolve, reject) => fs.read(fd, buf, 0, length, pos, (err, bytesRead, buffer) => {
			if (err) {
				return reject(err);
			}

			resolve(buffer, bytesRead);
		}));
	}
}