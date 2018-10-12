const fs = require('fs');
const Err = require('./Error.js');
const BufferWrap = require('./BufferWrap.js');
const EditStorage = require('./EditStorage.js');
const EventEmitter = require('events');

class FileWrap extends EventEmitter {
	constructor (fileDir) {
		super();

		this._fileDir = fileDir;
		this._loaded = new BufferWrap();
		this.fd = null;
		this.editStorage = new EditStorage();

		this.initialized = false;
		this.saving = false;
	}

	get loaded () {
		return this.fd !== null;
	}

	async init () {
		this.emit('init:start');

		try {
			this.fd = await this._open();
		} catch (err) {
			Err.FatalError(err, "Opening file to retrieve file-descriptor failed.");
		}

		try {
			this.editStorage.on('storeOffset', () => this.emit('edited'));
		} catch (err) {
			Err.FatalError(err, "Adding listener for storeOffset");
		}
		
		this.initialized = true;
		
		this.emit('init:done');
	}

	async save () {
		if (this.saving) {
			throw new Error("Can't save while already saving.");
		}

		this.saving = true;

		let size = await this.getSize(); // BigInt
		let sizeLeft = Number(size);
		console.log('Starting saving');
		while (sizeLeft > 0) {
			console.log('sizeLeft', sizeLeft);
			let currentPieceSize = null;

			if (sizeLeft > FileWrap.MAX_BUFFER_SIZE) {
				console.log('sizeLeft was bigger than max buffer size');
				currentPieceSize = Number(FileWrap.MAX_BUFFER_SIZE);
			} else { // lower than, so this is also the last write we need to do
				console.log('sizeLeft was lower than max buffer size');
				currentPieceSize = sizeLeft;
			}

			console.log('currentPieceSize', currentPieceSize);
			let buf = await this._loadData(sizeLeft - currentPieceSize, currentPieceSize);

			console.log('loaded data', buf);
			console.log('data length', buf.length);

			await new Promise((resolve, reject) => fs.write(this.fd, buf, (err, writtenBytes, buffer) => {
				if (err) {
					reject(err);
				}

				resolve(buffer, writtenBytes);
			}));

			console.log('wrote data');

			sizeLeft -= currentPieceSize;
		}
	}

	edit (offset, value) {
		return this.editStorage.storeOffset(offset, value);
	}

	editRange (offsetStart, offsetEnd, values) {
		return this.editStorage.storeOffsetRange(offsetStart, offsetEnd, values);
	}

	editOffsets (offsets, values) {
		return this.editStorage.storeOffsets(offsets, values);
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

	_loadData (pos, length, killEditStorage=false, fd=null) {
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

			this.editStorage.writeBuffer(pos, buffer, killEditStorage)
				.then(buf => resolve(buf, bytesRead));
		}));
	}
}

FileWrap.MAX_BUFFER_SIZE = 1024n * 1024n // 1 MegaByte (1024 bytes * 1024 times = 1MB)
	* 256n; // 256mb

module.exports = FileWrap;