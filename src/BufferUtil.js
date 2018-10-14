/*
	Functions meant to be useful in dealing with buffers that shouldn't have to be wrapped in BufferWrap
*/

const BufferWrap = require('./BufferWrap.js');

const ENDIAN = {
	BIG: 0,
	LITTLE: 1,
};

// Might modify this later to return the buffer property of BufferWrap if I feel it is needed
// Does feel like a waste to check instanceof a ton of times when you're gonna have to call these funcs a lot
function getBuffer (buf) {
	return buf;
}

function clearBuffer (buf) {
	buf = getBuffer(buf);

	buf.fill(0, 0, buf.length);

	return buf;
}

function manageEndian (bigEndianFunction, littleEndianFunction, endian) {
	if (endian === ENDIAN.BIG) {
		return bigEndianFunction;
	} else if (endian === ENDIAN.LITTLE) {
		return littleEndianFunction;
	}

	throw new TypeError("endianness given to BufferUtil - manageEndian was neither 0 (Big) or 1 (Little). It was: " + endian);
}

// Nodejs docs says "Reads a 64-bit double" :/ won't that lose detail? 
function readDouble (buf, offset, endian) {
	// no need to use getBuffer, as the functions this uses will call it themselves
	return manageEndian(readDoubleBE, readDoubleLE, endian)(buf, offset);
}

function readDoubleBE (buf, offset) {
	buf = getBuffer(buf);

	return buf.readDoubleBE(offset);
}

function readDoubleLE (buf, offset) {
	buf = getBuffer(buf);

	return buf.readDoubleLE(offset);
}

function readFloat (buf, offset, endian) {
	return manageEndian(readFloatBE, readFloatLE, endian)(buf, offset);
}

function readFloatBE (buf, offset) {
	buf = getBuffer(buf);

	return buf.readFloatBE(offset);
}

function readFloatLE (buf, offset) {
	buf = getBuffer(buf);

	return buf.readFloatLE(offset);
}

function readInt8 (buf, offset) {
	buf = getBuffer(buf);

	return buf.readInt8(offset);
}

function readUInt8 (buf, offset) {
	buf = getBuffer(buf);

	return buf.readUInt8(offset);
}

function readInt16 (buf, offset, endian) {
	return manageEndian(readInt16BE, readInt16LE, endian)(buf, offset);
}

function readInt16BE (buf, offset) {
	buf = getBuffer(buf);

	return buf.readInt16BE(offset);
}

function readInt16LE (buf, offset) {
	buf = getBuffer(buf);

	return buf.readInt16LE(buf, offset);
}

function readUInt16 (buf, offset, endian) {
	return manageEndian(readUInt16BE, readUInt16LE, endian)(buf, offset);
}

function readUInt16BE (buf, offset) {
	buf = getBuffer(buf);

	return buf.readUInt16BE(offset);
}

function readUInt16LE (buf, offset) {
	buf = getBuffer(buf);

	return buf.readUInt16LE(buf, offset);
}

function readInt32 (buf, offset, endian) {
	return manageEndian(readInt32BE, readInt32LE, endian)(buf, offset);
}

function readInt32BE (buf, offset) {
	buf = getBuffer(buf);

	return buf.readInt32BE(offset);
}

function readInt32LE (buf, offset) {
	buf = getBuffer(buf);

	return buf.readInt32LE(buf, offset);
}

function readUInt32 (buf, offset, endian) {
	return manageEndian(readUInt32BE, readUInt32LE, endian)(buf, offset);
}

function readUInt32BE (buf, offset) {
	buf = getBuffer(buf);

	return buf.readUInt32BE(offset);
}

function readUInt32LE (buf, offset) {
	buf = getBuffer(buf);

	return buf.readUInt32LE(buf, offset);
}

// This is probably unnecesecary
function slice (buf, start, end) {
	buf = getBuffer(buf);

	return buf.slice(start, end);
}

function values (buf) {
	buf = getBuffer(buf);

	return buf.values();
}

function valuesArray (buf) {
	return [...values(buf)];
}

function writeString (buf, str, offset=0, encoding='utf8') {
	buf = getBuffer(buf);

	return this._buffer.write(str, offset, encoding);
}

function writeDouble (buf, offset, value, endian) {
	return manageEndian(writeDoubleBE, writeDoubleLE, endian)(buf, offset, value);
}

function writeDoubleBE (buf, offset, value) {
	buf = getBuffer(buf);

	return buf.writeDoubleBE(value, offset);
}

function writeDoubleLE (buf, offset, value) {
	buf = getBuffer(buf);

	return buf.writeDoubleLE(value, offset);
}

function writeFloat (buf, offset, value, endian) {
	return manageEndian(writeFloatBE, writeFloatLE, endian)(buf, offset, value);
}

function writeFloatBE (buf, offset, value) {
	buf = getBuffer(buf);

	return buf.writeFloatBE(value, offset);
}

function writeFloatLE (buf, offset, value) {
	buf = getBuffer(buf);

	return buf.writeFloatLE(value, offset);
}

function writeInt8 (buf, offset, value) {
	buf = getBuffer(buf);

	return buf.writeInt8(value, offset);
}

function writeUInt8 (buf, offset, value) {
	buf = getBuffer(buf);

	return buf.writeUInt8(value, offset);
}

function writeInt16 (buf, offset, value, endian) {
	return manageEndian(writeInt16BE, writeInt16LE, endian)(buf, offset, value);
}

function writeInt16BE (buf, offset, value) {
	buf = getBuffer(buf);

	return buf.writeInt16BE(value, offset);
}

function writeInt16LE (buf, offset, value) {
	buf = getBuffer(buf);

	return buf.writeInt16LE(value, offset);
}

function writeUInt16 (buf, offset, value, endian) {
	return manageEndian(writeUInt16BE, writeUInt16LE, endian)(buf, offset, value);
}

function writeUInt16BE (buf, offset, value) {
	buf = getBuffer(buf);

	return buf.writeUInt16BE(value, offset);
}

function writeUInt16LE (buf, offset, value) {
	buf = getBuffer(buf);

	return buf.writeUInt16LE(value, offset);
}

function writeInt32 (buf, offset, value, endian) {
	return manageEndian(writeInt32BE, writeInt32LE, endian)(buf, offset, value);
}

function writeInt32BE (buf, offset, value) {
	buf = getBuffer(buf);

	return buf.writeInt32BE(value, offset);
}

function writeInt32LE (buf, offset, value) {
	buf = getBuffer(buf);

	return buf.writeInt32LE(value, offset);
}

function writeUInt32 (buf, offset, value, endian) {
	return manageEndian(writeUInt32BE, writeUInt32LE, endian)(buf, offset, value);
}

function writeUInt32BE (buf, offset, value) {
	buf = getBuffer(buf);

	return buf.writeInt16BE(value, offset);
}

function writeUInt32LE (buf, offset, value) {
	buf = getBuffer(buf);

	return buf.writeUInt32LE(value, offset);
}

module.exports = {
	ENDIAN,

	values,
	valuesArray,
	
	clear: clearBuffer,
	get: getBuffer,
	slice,
	
	manageEndian,

	readDouble,
	readFloat,
	readInt8,
	readUInt8,
	readInt16,
	readUInt16,
	readInt32,
	readUInt32,
	
	writeDouble,
	writeFloat,
	writeInt8,
	writeUInt8,
	writeInt16,
	writeUInt16,
	writeInt32,
	writeUInt32,
	writeString,
};