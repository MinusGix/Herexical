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

	getStats () {
		return new Promise((resolve, reject) => fs.stat(this._fileDir, {
			bigint: true, // get the numbers in BigInt
		}, (err, stats) => {
			if (err) {
				return reject(err);
			}

			resolve(stats);
		}));
	}

	loadData (pos, length) {
		return this._loadData(pos, length)
			.then((buffer, bytesRead) => this._loaded.swapBuffer(buffer));
	}

	getSize () {
		return this.getStats()
			.then(stats => stats.size) // BigInt
	}


	_open () {
		return new Promise((resolve, reject) => fs.open(this._fileDir, 'r+', (err, fd) => {
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

		if (length > FileWrap.MAX_BUFFER_SIZE) {
			throw new RangeError("Attempted to construct buffer of larger than `" + FileWrap.MAX_BUFFER_SIZE + "` size.");
		}

		let buf = Buffer.alloc(length);

		return new Promise((resolve, reject) => fs.read(fd, buf, 0, length, pos, (err, bytesRead, buffer) => {
			if (err) {
				return reject(err);
			}

			resolve(buffer, bytesRead);
		}));
	}
}

FileWrap.MAX_BUFFER_SIZE = 1024n * 1024n // 1 MegaByte (1024 bytes * 1024 times = 1MB)
	* 256n; // 256mb

module.exports = FileWrap;