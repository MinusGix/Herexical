const fs = require('fs');
const Err = require('./Error.js');
const BufferWrap = require('./BufferWrap.js');
const EditStorage = require('./EditStorage.js')(); // load the default EditStorage
const EventEmitter = require('events');
const Log = require('./Log.js');
const Idle = require('./Idle.js');

Log.timeStart('Loading-FileWrap');

class FileWrap extends EventEmitter {
	constructor (fileDir) {
		super();

		this._fileDir = fileDir;
		this._loaded = new BufferWrap();
		this.fd = null;
		this.editStorage = new EditStorage(this);

		this.initialized = false;
		this.saving = false;

		this._idleSize = Idle.AsyncIdle(() => 
			this.getStats()
			.then(stats => stats.size)
		);
	}

	get loaded () {
		return this.fd !== null;
	}

	async init () {
		Log.timeStart('FileWrap-init');
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
		Log.timeEnd('FileWrap-init');
	}

	save () {
		return this.editStorage.save();
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
		Log.timeStart('FileWrap-getStats');

		return new Promise((resolve, reject) => fs.stat(this._fileDir, {
			bigint: true, // get the numbers in BigInt
		}, (err, stats) => {
			if (err) {
				return reject(err);
			}

			Log.timeEnd('FileWrap-getStats');
			resolve(stats);
		}));
	}

	loadData (pos, length) {
		return this._loadData(pos, length)
			.then((buffer, bytesRead) => this._loaded.swapBuffer(buffer));
	}

	getSize () {
		return this._idleSize();
	}


	_open () {
		Log.timeStart('FileWrap-_open');

		return new Promise((resolve, reject) => fs.open(this._fileDir, 'r+', (err, fd) => {
			if (err) {
				throw err;
			}

			Log.timeEnd('FileWrap-_open');
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

		Log.timeStart('FileWrap-_loadData');

		return new Promise((resolve, reject) => fs.read(fd, Buffer.alloc(length), 0, length, pos, (err, bytesRead, buffer) => {
			if (err) {
				return reject(err);
			}

			Log.info('bytesRead', bytesRead);

			// Since the Buffer is allocated to the size given, if there isn't data (such as reading near the end of the file) it will be filled with 00's
			// This slices it so that it is only what is actually visible
			if (buffer.length !== bytesRead) {
				Log.info("Buffer.length", buffer.length, "bytesRead", bytesRead);
				buffer = buffer.slice(0, bytesRead);
				Log.info("Buffer.length now", buffer.length);
			}

			Log.timeEnd('FileWrap-_loadData');

			this.editStorage.writeBuffer(pos, buffer, killEditStorage)
				.then(buf => resolve(buf, bytesRead));
		}));
	}
}

FileWrap.MAX_BUFFER_SIZE = 1024n * 1024n // 1 MegaByte (1024 bytes * 1024 times = 1MB)
	//* 256n; // 256mb

module.exports = FileWrap;

Log.timeEnd('Loading-FileWrap');