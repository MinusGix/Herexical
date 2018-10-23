/*
	Functions meant to be useful in dealing with buffers that shouldn't have to be wrapped in BufferWrap
*/

const BufferWrap = require('./BufferWrap.js');
const BigIntBuffer = require('bigint-buffer');

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


// BigInt functions, separate just to keep it simpler

function writeBigInt (buf, offset, value, size, endian) {
	return manageEndian(writeBigIntBE, writeBigIntLE, endian)(buf, offset, size, value);
}

function writeBigIntBE (buf, offset, size=8, value) {
	buf = getBuffer(buf);

	return buf.copy(BigIntBuffer.toBufferBE(value, size), offset);
}

function writeBigIntLE (buf, offset, size=8, value) {
	buf = getBuffer(buf);

	return buf.copy(BigIntBuffer.toBufferLE(value, size), offset);
}

function _writeArbBit (buf, offset, bitCount, value, endian) {
	if (bitCount % 8 !== 0 && bitCount !== 0) {
		// It would be nice to write any integer with any bit count but its not really needed right now
		throw new Error("Sorry, but currently only bitCounts divisible by 8 are not able to be written.");
	}

	return writeBigInt(buf, offset, value, bitCount / 8, endian);
}

function writeArbBitInt (buf, offset, bitCount, value, endian) {
	return _writeArbBit(buf, offset, bitCount, BigInt.asIntN(bitCount, value), endian);
}

function writeArbBitUInt (buf, offset, bitCount, value, endian) {
	return _writeArbBit(buf, offset, bitCount, BigInt.asUintN(bitCount, value), endian);
}

function writeInt64 (buf, offset, value, endian) {
	return writeArbBitInt(buf, offset, 64, value, endian);
}

function writeUInt64 (buf, offset, value, endian) {
	return writeArbBitUInt(buf, offset, 64, value, endian);
}

function writeInt128 (buf, offset, value, endian) {
	return writeArbBitInt(buf, offset, 128, value, endian);
}

function writeUInt128 (buf, offset, value, endian) {
	return writeArbBitUInt(buf, offset, 128, value, endian);
}

function readBigInt (buf, offset, size=8, endian) {
	return manageEndian(readBigIntBE, readBigIntLE, endian)(buf, offset, size);
}

function readBigIntBE (buf, offset, size=8) {
	buf = getBuffer(buf);
	
	return BigIntBuffer.toBigIntBE(buf.slice(offset, offset + size));
}

function readBigIntLE (buf, offset, size=8) {
	buf = getBuffer(buf);

	return BigIntBuffer.toBigIntLE(buf.slice(offset, offset + size));
}

function _readArbBit (buf, offset, bitCount, endian) {
	if (bitCount % 8 !== 0 && bitCount !== 0) {
		// It would be nice to read any integer with any bit count but it's not really needed right now
		throw new Error("Sorry, but currently only bitCounts divisible by 8 (basically into a byte count) are not able to be read.");
	}

	return readBigInt(buf, offset, bitCount / 8, endian);
}

function readArbBitInt (buf, offset, bitCount, endian) {
	return BigInt.asIntN(bitCount, _readArbBit(buf, offset, bitCount, endian));
}

function readArbBitUInt (buf, offset, bitCount, endian) {
	return BigInt.asUintN(bitCount, _readArbBit(buf, offset, bitCount, endian));
}

function readInt64 (buf, offset, endian) {
	return readArbBitInt(buf, offset, 64, endian);
}

function readUInt64 (buf, offset, endian) {
	return readArbBitUInt(but, offset, 64, endian);
}

// Should work, untested
function readInt128 (buf, offset, endian) {
	return readArbBitInt(buf, offset, 128, endian);
}

function readUInt128 (buf, offset, edian) {
	return readArbBitUInt(buf, offset, 128, endian);
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

	
	readBigInt,
	readArbBitInt,
	readArbBitUInt,
	readInt64,
	readUInt64,
	readInt128,
	readUInt128,
	
	writeDouble,
	writeFloat,
	writeInt8,
	writeUInt8,
	writeInt16,
	writeUInt16,
	writeInt32,
	writeUInt32,
	writeString,

	writeBigInt,
	writeArbBitInt,
	writeArbBitUInt,
	writeInt64,
	writeUInt64,
	writeInt128,
	writeUInt128,
};