const BufferWrap = require('./BufferWrap.js');
const Err = require('./Error.js');
const EventEmitter = require('events');
const Log = require('./Log.js');
const BufUtil = require('./BufferUtil.js');
const fs = require('fs');
const path = require('path');
const EditStorage = require('./EditStorage.js')(); // Load the default editstorage
const Idle = require('./Idle.js');

Log.timeStart('Loading-View');

class View extends EventEmitter {
	constructor (file) {
		super();

		this._fileDir = file;
		this._loadedData = new BufferWrap();
		this.fd = null;
		this.editStorage = new EditStorage(this);

		this.initialized = false;
		this.saving = false;

		this._idleSize = Idle.AsyncIdle(() => 
			this.getStats()
			.then(stats => stats.size)
		);

		this._idleName = Idle.Idle(() => path.basename(this._fileDir));

		this._viewSize = 64; // How many bytes to load whenever its told to load
		this._position = 0; // the current position in the file by bytes

		this.loaded = false;
	}

	get fileIsLoaded () {
		return this.fd !== null;
	}

	get viewSize () {
		return this._viewSize;
	}

	set viewSize (newViewSize) {
		this._viewSize = newViewSize;
		this.loaded = false;

		this.emit('unloaded');
	}

	get position () {
		return this._position;
	}

	set position (newPosition) {
		this._position = newPosition;
		this.loaded = false;

		this.emit('unloaded');
	}

	async init () {
		Log.timeStart('View-Init');
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

		this.on('edited', () => {
			this.loaded = false;

			this.emit('unloaded');
		});

		this.initialized = true;

		this.emit('init:done');
		Log.timeEnd('View-Init');
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

	async searchString (searchString, caseSensitive=true) {
		return await this.searchHexArray(searchString.split('').map(chr => chr.charCodeAt(0)), this.__getNoCaseSensitivityMatch(caseSensitive));
	}

	// A very internal function, like the insides of an organ. This will almost certainly be removed when I make these search funcs less repetitive
	__getNoCaseSensitivityMatch (caseSensitive) {
		if (caseSensitive) {
			return undefined; // No need for a special func, the normal comparing byte values will work
		} else {
			// Note: if I ever switch over to codePoint or some other function in searching strings this will need to be updated
			return (storedVal, searchVal) => {
				const chr = String.fromCharCode(searchVal);

				// Have to test both uppercase and lowercase as I don't know which one searchVal is.
				return searchVal === storedVal || 
					chr.toUpperCase().charCodeAt(0) === storedVal || 
					chr.toLowerCase().charCodeAt(0) === storedVal;
			};
		}
	}

	async searchStringGenerator (searchString, caseSensitive=true) {
		return this.searchHexArrayGenerator(searchString.split('').map(chr => chr.charCodeAt(0)), this.__getNoCaseSensitivityMatch(caseSensitive));
	}

	async searchHexArray (hexArr, isMatch) {
		// Since we know this generator will eventually end we can just grab all of them.
		// I would prefer if this wasn't used, and the generator was used as needed.
		let results = [];
		let iter = this.searchHexArrayGenerator(hexArr, isMatch);

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

	async * searchHexArrayGenerator (hexArr, isMatch) {
		if (typeof(isMatch) !== 'function') {
			isMatch = (storedVal, searchVal) => storedVal === searchVal;
		}

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

				if (isMatch(hexArr[hexPos], buf[searchPos + hexPos])) {
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
		Log.timeStart('View-getStats');

		return new Promise((resolve, reject) => fs.stat(this._fileDir, {
			bigint: true, // get the numbers in BigInt
		}, (err, stats) => {
			if (err) {
				return reject(err);
			}

			Log.timeEnd('View-getStats');
			resolve(stats);
		}));
	}

	loadData (pos, length) {
		return this._loadData(pos, length)
			.then((buffer, bytesRead) => this._loadedData.swapBuffer(buffer));
	}

	getSize () {
		return this._idleSize();
	}

	_open () {
		Log.timeStart('View-_open');

		return new Promise((resolve, reject) => fs.open(this._fileDir, 'r+', (err, fd) => {
			if (err) {
				Log.timeEnd('View-_open');
				
				reject(err);
				
				return;
			}

			Log.timeEnd('View-_open');
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

		if (length > View.MAX_BUFFER_SIZE) {
			throw new RangeError("Attempted to construct buffer of larger than `" + View.MAX_BUFFER_SIZE + "` size.");
		}

		Log.timeStart('View-_loadData');

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

			Log.timeEnd('View-_loadData');

			this.editStorage.writeBuffer(pos, buffer, killEditStorage)
				.then(buf => resolve(buf, bytesRead));
		}));
	}

	// Returns the offset into a file of the offset into the currently loaded buffer
	getFileOffset (bufferOffset) {
		if (typeof(bufferOffset) !== 'number') {
			throw new TypeError("bufferOffset param was not a number.");
		}

		// They've modified viewSize or position, so I can't accurately determine where it's from
		if (!this.loaded) {
			return null;
		}

		return this.position + bufferOffset;
	}

	async loadView (force=false) {
		if (this.loaded && !force) {
			return false; // the view has already been loaded, no need to reload it
		}

		Log.timeStart('View-loadView');
		this.emit('loadView:start');

		await this.loadData(this.position, this.viewSize);
		this.loaded = true;
		
		this.emit('loadView:done');
		Log.timeEnd('View-loadView');

		return true;
	}

	// Get some data about some stuff at the offset, such as it's values in various types, etc
	async getDataOnOffset (offset, area=null) {
		Log.timeStart('getDataOnOffset');

		if (area === null) {
			area = await this._loadData(offset, 8); // 8, because the max length of int64 is 8 and that's the highest
		}

		const endian = this._loadedData.defaultEndian;

		const data = {
			offset,
			
			Int8: await this._getInt8(0, area), // -128 to 127 (256 values, including 0)
			UInt8: await this._getUInt8(0, area), // 0 to 255 (256 values)
			
			Int16: await this._getInt16(0, endian, area), // -32,768 to 32,767 (65,536 values, including 0)
			UInt16: await this._getUInt16(0, endian, area), // 0 to 65,535 (65,536 values)

			Int32: await this._getInt32(0, endian, area),
			UInt32: await this._getUInt32(0, endian, area),

			Int64: await this._getInt64(offset, endian, area), // Needs Int64 support
			UInt64: await this._getUInt64(offset, endian, area),

			Float32: null, // There is a buffer readFloat(BE|LE) function but I want to make sure before using it
			Float64: null, // Needs float64 support

			Decimal: null, // Unsure, should this be the entire area size or something like read the bytes in the area by themselves (bless seems to do something like this? Then it's just int64 (assuming this isn't given an area larger than it)
			Octal: null, // Have to look up how to convert numbers to octal, and decide on the same as Decimal.
			Binary: null, // Same as above.
		};

		Log.timeEnd('getDataOnOffset', offset);

		return data;
	}

	// Get signed Int8. Size: 1 byte. No need for endian.
	async _getInt8 (offset, area=null) {
		if (area === null) { // if area is null, then we assume that offset is offset into file rather than offset into area
			area = await this._loadData(offset, 1);
			offset = 0;
		}

		return area.readInt8(offset);
	}

	// Get unsigned Int8. Size: 1 byte. No need for endian.
	async _getUInt8 (offset, area=null) {
		if (area === null) {
			area = await this._loadData(offset, 1);
			offset = 0;
		}

		return area.readUInt8(offset);
	}

	// Get signed Int16. Size: 2 bytes
	async _getInt16 (offset, endian=0, area=null) {
		if (area === null) {
			area = await this._loadData(offset, 2);
			offset = 0;
		}

		if (endian === 0) { // Big Endian
			return area.readInt16BE(offset);
		} else { // Little Endian
			return area.readInt16LE(offset);
		}
	}

	// Get unsigned Int16. Size: 2 bytes
	async _getUInt16 (offset, endian=0, area=null) {
		if (area === null) {
			area = await this._loadData(offset, 2);
			offset = 0;
		}

		if (endian === 0) {
			return area.readUInt16BE(offset);
		} else {
			return area.readUInt16LE(offset);
		}
	}

	// Get signed Int32. Size: 4 bytes
	async _getInt32 (offset, endian=0, area=null) {
		if (area === null) {
			area = await this._loadData(offset, 4);
			offset = 0;
		}

		if (endian === 0) {
			return area.readInt32BE(offset);
		} else {
			return area.readInt32LE(offset);
		}
	}

	// Get unsigned Int32. Size: 4 bytes
	async _getUInt32 (offset, endian=0, area=null) {
		if (area === null) {
			area = await this._loadData(offset, 4);
			offset = 0;
		}

		if (endian === 0) {
			return area.readUInt32BE(offset);
		} else {
			return area.readUInt32LE(offset);
		}
	}

	async _getInt64 (offset, endian=0, area=null) {
		if (area === null) {
			area = await this._loadData(offset, 8);
			offset = 0;
		}

		return BufUtil.readInt64(area, offset, endian);
	}

	async _getUInt64 (offset, endian=0, area=null) {
		if (area === null) {
			area = await this._loadData(offset, 8);
			offset = 0;
		}

		return BufUtil.readUInt64(area, offset, endian);
	}
}

View.MAX_BUFFER_SIZE = 1024n * 1024n; // 1 MB (1024 bytes * 1024 times)

module.exports = View;

Log.timeEnd('Loading-View');