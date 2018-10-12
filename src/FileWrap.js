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

		console.time('save');

		this.saving = true;

		let sizeLeft = Number(await this.getSize());
		let currentPieceSize = 0;
		let fd = this.fd;

		console.log('Starting saving');
		
		while (sizeLeft > 0) {
			let hasEdits = await this.editStorage.hasEdits();
			console.log('hasEdits:', hasEdits);
			console.log('Edits:', this.editStorage.data);

			if (!hasEdits) { // if there's no more edits, we don't need to mess with the rest of the file!
				break;
			}

			console.time('save-loop');
			
			console.log('sizeLeft', sizeLeft);

			if (sizeLeft > FileWrap.MAX_BUFFER_SIZE) {
				console.log('sizeLeft was bigger than max buffer size');
				currentPieceSize = Number(FileWrap.MAX_BUFFER_SIZE);
			} else { // lower than, so this is also the last write we need to do
				console.log('sizeLeft was lower than max buffer size');
				currentPieceSize = sizeLeft;
			}

			console.log('currentPieceSize', currentPieceSize);
			let buf = await this._loadData(sizeLeft - currentPieceSize, currentPieceSize, true);

			console.log('loaded data', buf);
			console.log('data length', buf.length);

			await new Promise((resolve, reject) => fs.write(fd, buf, (err) => {
				if (err) {
					reject(err);
				}

				resolve();
			}));

			console.log('wrote data');

			sizeLeft -= currentPieceSize;

			console.timeEnd('save-loop');
		}

		console.timeEnd('save');
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

		return new Promise((resolve, reject) => fs.read(fd, Buffer.alloc(length), 0, length, pos, (err, bytesRead, buffer) => {
			if (err) {
				return reject(err);
			}

			this.editStorage.writeBuffer(pos, buffer, killEditStorage)
				.then(buf => resolve(buf, bytesRead));
		}));
	}
}

FileWrap.MAX_BUFFER_SIZE = 1024n * 1024n // 1 MegaByte (1024 bytes * 1024 times = 1MB)
	//* 256n; // 256mb

module.exports = FileWrap;