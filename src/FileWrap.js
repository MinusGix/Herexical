const fs = require('fs');
const path = require('path');
const Err = require('./Error.js');
const BufferWrap = require('./BufferWrap.js');
const EditStorage = require('./EditStorage.js')(); // load the default EditStorage
const EventEmitter = require('events');
const Log = require('./Log.js');
const Idle = require('./Idle.js');
const BufUtil = require('./BufferUtil.js');

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

		this._idleName = Idle.Idle(() => path.basename(this._fileDir));
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

	// Returns the name of the file, because the fileDir is likely to have other path info on it
	getFilename () {
		return this._idleName();
	}

	// Returns an [searchValueStartOffset, searchValueEndOffset][]
	async search (type='string', value) {
		Log.timeStart('search');

		let results;

		if (type === 'string' || type === 'str') {
			results = await this.searchString(value);
		} else if (type === 'hex' || type === 'hexadecimal') {
			results = await this.searchHexArray(value);
		} else if (type === 'buffer' || type === 'buf') {
			results = await this.searchHexBuffer(value);
		} else {
			Log.timeEnd('search', 'err');

			throw TypeError("Unknown type given, was given: '" + type + "'");
		}

		Log.timeEnd('search', 'resultCount:', results.length);

		return results;
	}

	// Returns an iterator for [searchValueStartOffset, searchValueEndOffset]
	async searchGenerator (type='string', value) {
		Log.timeStart('search-generator');

		let iter;

		if (type === 'string' || type === 'str') {
			iter = await this.searchStringGenerator(value);
		} else if (type === 'hex' || type === 'hexadecimal') {
			iter = await this.searchHexArrayGenerator(value);
		} else if (type === 'buffer' || type === 'buf') {
			iter = await this.searchHexBufferGenerator(value);
		} else {
			Log.timeEnd('search-generator', 'err');

			throw TypeError("Unknown type given, was given: '" + type + "'");
		}

		Log.timeEnd('search-generator');

		return iter;
	}

	async searchString (searchString) {
		return await this.searchHexArray(searchString.split('').map(chr => chr.charCodeAt(0)));
	}

	async searchStringGenerator (searchString) {
		return this.searchHexArrayGenerator(searchString.split('').map(chr => chr.charCodeAt(0)));
	}

	async searchHexArray (hexArr) {
		// Since we know this generator will eventually end we can just grab all of them.
		// I would prefer if this wasn't used, and the generator was used as needed.
		let results = [];
		let iter = this.searchHexArrayGenerator(hexArr);

		// TODO: Bleh, while(true) should be changed to something less likely to trap itself in eternal purgatory
		while (true) {
			let res = await iter.next();
			
			// the last value does not have the done prop 
			if (res.done) {
				break;
			}

			results.push(res.value);
		}

		// It seems that I can't just do [...iter] like a normal iterator since this is async
		return results;
	}

	async * searchHexArrayGenerator (hexArr) {
		let offset = 0;
		// TODO: add some form of math to calculate a good view size. We don't want to load too much into memory 
		//	if they're searching a really long string but we don't want to load too little if they're using a small number
		let searchSize = hexArr.length;
		let viewSize = searchSize * 64;
		let fileSize = await this.getSize();

		let buf;
		let hexPos = 0;
		let searchPos = 0;

		while (offset < fileSize) {
			buf = await this._loadData(offset, viewSize);

			hexPos = 0;
			searchPos = 0;

			while (searchPos < buf.length) {
				if (hexPos === searchSize) {
					yield [offset + searchPos, offset + searchPos + searchSize - 1];

					hexPos = 0;
					searchPos++;
				}

				if (hexArr[hexPos] === buf[searchPos + hexPos]) {
					hexPos++;
				} else {
					hexPos = 0;
					searchPos++;
				}
			}
			
			offset += viewSize;
		}
	}

	async searchHexBuffer (buf) {
		return this.searchHexArray(BufUtil.valuesArray(buf));
	}

	async searchHexBufferGenerator (buf) {
		return this.searchHexArrayGenerator(BufUtil.valuesArray(buf));
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