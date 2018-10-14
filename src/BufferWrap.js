const Err = require('./Error.js');
const Log = require('./Log.js');
const BufUtil = require('./BufferUtil.js');
const ENDIAN = BufUtil.ENDIAN;

Log.timeStart('Loading-BufferWrap');

class BufferWrap {
	constructor () {
		this._buffer = null;
		this.defaultEndian = ENDIAN.BIG;
	}

	resetBuffer () {
		this._buffer = null;
	}

	clearBuffer () {
		return BufUtil.clear(this._buffer);
	}

	swapBuffer (buffer) {
		if (buffer instanceof Buffer) {
			this._buffer = buffer;
		} else if (buffer instanceof BufferWrap) {
			this._buffer = buffer._buffer;
		} else {
			throw new TypeError("BufferWrap#swapBuffer given argument that was not an instance of Buffer or BufferWrap.");
		}
	}

	setEndian (endian) {
		if (typeof(endian) === 'number') {
			if (endian === ENDIAN.BIG || endian === ENDIAN.LITTLE) {
				this.defaultEndian = endian;
			} else {
				throw new TypeError(endian + " is an invalid endian.");
			}
		} else if (typeof(endian) === 'string') {
			endian = endian.toLowerCase();

			if (endian === 'little' || endian === 'littleendian' || endian === 'little-endian' || endian === 'little endian') {
				return this.setEndian(ENDIAN.LITTLE);
			} else if (endian === 'big' || endian === 'bigendian' || endian === 'big-endian' || endian === 'big endian') {
				return this.setEndian(ENDIAN.BIG);
			} else {
				throw new TypeError(endian + " is an invalid endian.");
			}
		}
	}

	// If I ever make more than one endian setting this won't work
	flipEndian () {
		if (this.defaultEndian === ENDIAN.BIG) {
			return this.setEndian(1);
		} else if (this.defaultEndian === ENDIAN.LITTLE) {
			return this.setEndian(0);
		}

		// TODO: with better error managing, make this less fatal but still dangerous. Perhaps a leveled 
		Err.FatalError("BufferWrap#defaultEndian property was neither 0 (Big Endian) or 1 (Little Endian)!");
	} 

	manageEndian (bigEndianFunction, littleEndianFunction, type, ...args) {
		if (typeof(type) !== 'number') {
			type = this.defaultEndian;
		}

		if (type === ENDIAN.BIG) {
			return bigEndianFunction(...args);
		} else if (type === ENDIAN.LITTLE) {
			return littleEndianFunction(...args);
		}

		throw new TypeError("type given to BufferWrap#manageEndian was neither 0 (Big Endian) or 1 (Little Endian). It was: " + type);
	}

	readDoubleBE (offset) {
		return this.readDouble(offset, ENDIAN.BIG);
	}

	readDoubleLE (offset) {
		return this.readDouble(offset, ENDIAN.LITTLE);
	}

	readDouble (offset, endian) {
		return BufUtil.readDouble(this._buffer, offset, endian);
	}

	readFloatBE (offset) {
		return this.readFloat(offset, ENDIAN.BIG);
	}

	readFloatLE (offset) {
		return this.readFloat(offset, ENDIAN.LITTLE);
	}

	readFloat (offset, endian) {
		return BufUtil.readFloat(this._buffer, offset, endian);
	}

	readInt8 (offset) {
		return BufUtil.readInt8(this._buffer, offset);
	}

	readInt16BE (offset) {
		return this.readInt16(offset, ENDIAN.BIG);
	}

	readInt16LE (offset) {
		return this.readInt16(offset, ENDIAN.LITTLE);
	}

	readInt16 (offset, endian) {
		return BufUtil.readInt16(this._buffer, offset, endian);
	}

	readInt32BE (offset) {
		return this.readInt32(offset, ENDIAN.BIG);
	}

	readInt32LE (offset) {
		return this.readInt32(offset, ENDIAN.LITTLE);
	}

	readInt32 (offset, endian) {
		return BufUtil.readInt32(this._buffer, offset, endian);
	}

	readUInt8 (offset) {
		return BufUtil.readUInt8(this._buffer, offset);
	}

	readUInt16BE (offset) {
		return this.readUInt16(offset, ENDIAN.BIG);
	}

	readUInt16LE (offset) {
		return this.readUInt16(offset, ENDIAN.LITTLE);
	}

	readUInt16 (offset, endian) {
		return BufUtil.readUInt16(this._buffer, offset, endian);
	}

	readUInt32BE (offset) {
		return this.readUInt32(offset, ENDIAN.BIG);
	}

	readUInt32LE (offset) {
		return this.readUInt32(offset, ENDIAN.LITTLE);
	}

	readUInt32 (offset, endian) {
		return BufUtil.readUInt32(this._buffer, offset, endian);
	}

	slice (start, end) {
		return BufUtil.slice(this._buffer, start, end);
	}

	values () {
		return BufUtil.values(this._buffer);
	}

	writeString (str, offset=0, encoding='utf8') {
		return BufUtil.writeString(this._buffer, str, offset, encoding);
	}

	writeDoubleBE (value, offset) {
		return this.writeDouble(value, offset, ENDIAN.BIG);
	}

	writeDoubleLE (value, offset) {
		return this.writeDouble(value, offset, ENDIAN.BIG);
	}

	writeDouble (value, offset, endian) {
		return BufUtil.writeDouble(this._buffer, offset, value, endian);
	}

	writeFloatBE (value, offset) {
		return this.writeFloat(value, offset, ENDIAN.BIG);
	}

	writeFloatLE (value, offset) {
		return this.writeFloat(value, offset, ENDIAN.LITTLE);
	}

	writeFloat (value, offset, endian) {
		return BufUtil.writeFloat(this._buffer, offset, value, endian);
	}

	writeInt8 (value, offset) {
		return BufUtil.writeInt8(this._buffer, offset, value);
	}

	writeInt16BE (value, offset) {
		return this.writeInt16(value, offset, ENDIAN.BIG);
	}

	writeInt16LE (value, offset) {
		return this.writeInt16(value, offset, ENDIAN.LITTLE);
	}

	writeInt16 (value, offset, endian) {
		return BufUtil.writeInt16(this._buffer, offset, value, endian);
	}

	writeInt32BE (value, offset) {
		return this.writeInt32(value, offset, ENDIAN.BIG);
	}

	writeInt32LE(value, offset) {
		return this.writeInt32(value, offset, ENDIAN.LITTLE);
	}

	writeInt32 (value, offset, endian) {
		return BufUtil.writeInt32(this._buffer, offset, value, endian);
	}

	writeUInt8 (value, offset) {
		return BufUtil.writeUInt8(this._buffer, offset, value);
	}

	writeUInt16BE (value, offset) {
		return this.writeUInt16(value, offset, ENDIAN.BIG);
	}

	writeUInt16LE (value, offset) {
		return this.writeUInt16(value, offset, ENDIAN.LITTLE);
	}

	writeUInt16 (value, offset, endian) {
		return BufUtil.writeUInt16(this._buffer, offset, value, endian);
	}

	writeUInt32BE (value, offset) {
		return this.writeUInt32(value, offset, ENDIAN.LITTLE);
	}

	writeUInt32LE(value, offset) {
		return this.writeUInt32(value, offset, ENDIAN.LITTLE);
	}

	writeUInt32 (value, offset, endian) {
		return BufUtil.writeUInt32(this._buffer, offset, value, endian);
	}
}

Log.timeEnd('Loading-BufferWrap');

module.exports = BufferWrap;