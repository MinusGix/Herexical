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
}

module.exports = BufferWrap