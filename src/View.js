const FileWrap = require('./FileWrap.js');
const BufferWrap = require('./BufferWrap.js');
const Err = require('./Error.js');
const EventEmitter = require('events');
const Log = require('./Log.js');

Log.timeStart('Loading-View');

class View extends EventEmitter {
	constructor (file) {
		super();

		this.fileWrapper = new FileWrap(file);

		this._viewSize = 64; // How many bytes to load whenever its told to load
		this._position = 0; // the current position in the file by bytes

		this.loaded = false;
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

		await this.fileWrapper.init();

		this.fileWrapper.on('edited', () => {
			this.loaded = false;

			this.emit('unloaded');
		});

		this.emit('init:done');
		Log.timeEnd('View-Init');
	}

	async loadView (force=false) {
		if (this.loaded && !force) {
			return false; // the view has already been loaded, no need to reload it
		}

		Log.timeStart('View-loadView');
		this.emit('loadView:start');

		await this.fileWrapper.loadData(this.position, this.viewSize);
		this.loaded = true;
		
		this.emit('loadView:done');
		Log.timeEnd('View-loadView');

		return true;
	}

	// Get some data about some stuff at the offset, such as it's values in various types, etc
	async getDataOnOffset (offset, area=null) {
		Log.timeStart('getDataOnOffset');

		if (area === null) {
			area = await this.fileWrapper._loadData(offset, 8); // 8, because the max length of int64 is 8 and that's the highest
		}

		const endian = this.fileWrapper._loaded.defaultEndian;

		const data = {
			offset,
			
			Int8: await this._getInt8(0, area), // -128 to 127 (256 values, including 0)
			UInt8: await this._getUInt8(0, area), // 0 to 255 (256 values)
			
			Int16: await this._getInt16(0, endian, area), // -32,768 to 32,767 (65,536 values, including 0)
			UInt16: await this._getUInt16(0, endian, area), // 0 to 65,535 (65,536 values)

			Int32: await this._getInt32(0, endian, area),
			UInt32: await this._getUInt32(0, endian, area),

			Int64: null, // Needs Int64 support
			UInt64: null,

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
			area = await this.fileWrapper._loadData(offset, 1);
			offset = 0;
		}

		return area.readInt8(offset);
	}

	// Get unsigned Int8. Size: 1 byte. No need for endian.
	async _getUInt8 (offset, area=null) {
		if (area === null) {
			area = await this.fileWrapper._loadData(offset, 1);
			offset = 0;
		}

		return area.readUInt8(offset);
	}

	// Get signed Int16. Size: 2 bytes
	async _getInt16 (offset, endian=0, area=null) {
		if (area === null) {
			area = await this.fileWrapper._loadData(offset, 2);
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
			area = await this.fileWrapper._loadData(offset, 2);
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
			area = await this.fileWrapper._loadData(offset, 4);
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
			area = await this.fileWrapper._loadData(offset, 4);
			offset = 0;
		}

		if (endian === 0) {
			return area.readUInt32BE(offset);
		} else {
			return area.readUInt32LE(offset);
		}
	}
}

module.exports = View;

Log.timeEnd('Loading-View');