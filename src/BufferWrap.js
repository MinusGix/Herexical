class BufferWrap {
	constructor () {
		this._buffer = new Buffer();
	}

	readDoubleBE (offset) {
		return this._buffer.readDoubleBE(offset);
	}

	readDoubleLE (offset) {
		return this._buffer.readDoubleLE(offset);
	}

	readFloatBE (offset) {
		return this._buffer.readFloatBE(offset);
	}

	readFloatLE (offset) {
		return this._buffer.readFloatLE(offset);
	}

	readInt8 (offset) {
		return this._buffer.readInt8(offset);
	}

	readInt16BE (offset) {
		return this._buffer.readInt16BE(offset);
	}

	readInt16LE (offset) {
		return this._buffer.readInt16LE(offset);
	}

	readInt32BE (offset) {
		return this._buffer.readInt32BE(offset);
	}

	readInt32LE (offset) {
		return this._buffer.readInt32LE(offset);
	}

	readUInt8 (offset) {
		return this._buffer.readUInt8(offset);
	}

	readUInt16BE (offset) {
		return this._buffer.readUInt16BE(offset);
	}

	readUInt16LE (offset) {
		return this._buffer.readUInt16LE(offset);
	}

	readUInt32BE (offset) {
		return this._buffer.readUInt32BE(offset);
	}

	readUInt32LE (offset) {
		return this._buffer.readUInt32LE(offset);
	}

	slice (start, end) {
		return this._buffer.slice(start, end);
	}

	values () {
		return this._buffer.values();
	}

	writeString (string, offset=0, encoding='utf8') {
		return this._buffer.write(string, offset, undefined, encoding);
	}

	writeDoubleBE (value, offset) {
		return this._buffer.writeDoubleBE(value, offset);
	}

	writeDoubleLE (value, offset) {
		return this._buffer.writeDoubleLE(value, offset);
	}

	writeFloatBE (value, offset) {
		return this._buffer.writeFloatBE(value, offset);
	}

	writeFloatLE (value, offset) {
		return this._buffer.writeFloatLE(value, offset);
	}

	writeInt8 (value ,offset) {
		return this._buffer.writeInt8(value, offset);
	}

	writeInt16BE (value, offset) {
		return this._buffer.writeInt16BE(value, offset);
	}

	writeInt16LE (value, offset) {
		return this._buffer.writeInt16LE(value, offset);
	}

	writeInt32BE (value, offset) {
		return this._buffer.writeInt32BE(value, offset);
	}

	writeInt32LE(value, offset) {
		return this._buffer.writeInt32LE(value, offset);
	}

	writeUInt8 (value ,offset) {
		return this._buffer.writeUInt8(value, offset);
	}

	writeUInt16BE (value, offset) {
		return this._buffer.writeUInt16BE(value, offset);
	}

	writeUInt16LE (value, offset) {
		return this._buffer.writeUInt16LE(value, offset);
	}

	writeUInt32BE (value, offset) {
		return this._buffer.writeUInt32BE(value, offset);
	}

	writeUInt32LE(value, offset) {
		return this._buffer.writeUInt32LE(value, offset);
	}
}

module.exports = BufferWrap;