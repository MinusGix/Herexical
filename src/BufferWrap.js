class BufferWrap {
	constructor () {
		this._buffer = new Buffer();
	}

	manageEndian (bigEndianFunction, littleEndianFunction, type=0, ...args) {
		if (type === 0) { // Big Endian
			return bigEndianFunction(...args);
		} else if (type === 1) { // Little Endian
			return littleEndianFunction(...args);
		}

		throw new TypeError("type given to BufferWrap#manageEndian was neither 0 (Big Endian) or 1 (Little Endian). It was: " + type);
	}

	readDoubleBE (offset) {
		return this._buffer.readDoubleBE(offset);
	}

	readDoubleLE (offset) {
		return this._buffer.readDoubleLE(offset);
	}

	readDouble (offset, type=0) {
		return this.manageEndian(this.readDoubleBE, this.readDoubleLE, type, offset);
	}

	readFloatBE (offset) {
		return this._buffer.readFloatBE(offset);
	}

	readFloatLE (offset) {
		return this._buffer.readFloatLE(offset);
	}

	readFloat (offset, type=0) {
		return this.manageEndian(this.readFloatBE, this.readFloatLE, type, offset);
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

	readInt16 (offset, type=0) {
		return this.manageEndian(this.readInt16BE, this.readInt16LE, type, offset);
	}

	readInt32BE (offset) {
		return this._buffer.readInt32BE(offset);
	}

	readInt32LE (offset) {
		return this._buffer.readInt32LE(offset);
	}

	readInt32 (offset, type=0) {
		return this.manageEndian(this.readInt32BE, this.readInt32LE, type, offset);
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

	readUInt16 (offset, type=0) {
		return this.manageEndian(this.readUInt16BE, this.readUInt16LE, type, offset);
	}

	readUInt32BE (offset) {
		return this._buffer.readUInt32BE(offset);
	}

	readUInt32LE (offset) {
		return this._buffer.readUInt32LE(offset);
	}

	readUInt32 (offset, type=0) {
		return this.manageEndian(this.readUInt32BE, this.readUInt32LE, type, offset);
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

	writeDouble (value, offset, type=0) {
		return this.manageEndian(this.writeDoubleBE, this.writeDoubleLE, type, value, offset);
	}

	writeFloatBE (value, offset) {
		return this._buffer.writeFloatBE(value, offset);
	}

	writeFloatLE (value, offset) {
		return this._buffer.writeFloatLE(value, offset);
	}

	writeFloat (value, offset, type=0) {
		return this.manageEndian(this.writeFloatBE, this.writeFloatLE, type, value, offset);
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

	writeInt16 (value, offset, type=0) {
		return this.manageEndian(this.writeInt16BE, this.writeInt16LE, type, value, offset);
	}

	writeInt32BE (value, offset) {
		return this._buffer.writeInt32BE(value, offset);
	}

	writeInt32LE(value, offset) {
		return this._buffer.writeInt32LE(value, offset);
	}

	writeInt32 (value, offset, type=0) {
		return this.manageEndian(this.writeInt32BE, this.writeInt32LE, type, value, offset);
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

	writeUInt16 (value, offset, type=0) {
		return this.manageEndian(this.writeUInt16BE, this.writeUInt16LE, type, value, offset);
	}

	writeUInt32BE (value, offset) {
		return this._buffer.writeUInt32BE(value, offset);
	}

	writeUInt32LE(value, offset) {
		return this._buffer.writeUInt32LE(value, offset);
	}

	writeUInt32 (value, offset, type=0) {
		return this.manageEndian(this.writeUInt32BE, this.writeUInt32LE, type, value, offset);
	}
}

module.exports = BufferWrap;