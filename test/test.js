const expect = require('chai').expect;

const {BufferUtil, BufferWrap, Idle, Struct} = require('../index.js');

describe('BufferUtil', () => {
	describe('#getBuffer()', () => {
		it('should return the same buffer', () => {
			const testBuffer = Buffer.alloc(1);

			expect(BufferUtil.get(testBuffer)).to.be.equal(testBuffer);
		});

		// TODO: once you make getBuffer work on BufferWrap, add test
	});

	describe('#clearBuffer()', () => {
		it('should replace the buffer with all zeroes', () => {
			const testBuffer = Buffer.alloc(50);

			BufferUtil.clear(testBuffer);

			for (let i = 0 ; i < testBuffer.length; i++) {
				expect(testBuffer[i]).to.be.equal(0);
			}
		});

		it('should return the buffer', () => {
			const testBuffer = Buffer.alloc(5);

			expect(BufferUtil.clear(testBuffer)).to.be.equal(testBuffer);
		});
	});

	describe('#manageEndian()', () => {
		it('should return big endian function when big endian is used from enum', () => {
			const BigEndianFunction = (a) => a;
			const LittleEndianFunction = (b) => b;

			expect(BufferUtil.manageEndian(BigEndianFunction, LittleEndianFunction, BufferUtil.ENDIAN.BIG))
				.to.be.equal(BigEndianFunction);
		});

		it('should return little endian function when little endian is used from enum', () => {
			const BigEndianFunction = (a) => a;
			const LittleEndianFunction = (b) => b;

			expect(BufferUtil.manageEndian(BigEndianFunction, LittleEndianFunction, BufferUtil.ENDIAN.LITTLE))
				.to.be.equal(LittleEndianFunction);
		});
	});

	describe('#readDouble()', () => {
		it('should read big endian value correctly', () => {
			expect(BufferUtil.readDouble(Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]), 0, BufferUtil.ENDIAN.BIG))
				.to.be.equal(1.40159977307889e-309);
		});

		it('should read little endian value correctly', () => {
			expect(BufferUtil.readDouble(Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]), 0, BufferUtil.ENDIAN.LITTLE))
				.to.be.equal(7.949928895127363e-275);
		});
	});

	describe('#readFloat()', () => {
		it('should read big endian value correctly', () => {
			expect(BufferUtil.readFloat(Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]), 0, BufferUtil.ENDIAN.BIG))
				.to.be.equal(9.25571648671185e-41);
		});

		it('should read little endian value correctly', () => {
			expect(BufferUtil.readFloat(Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]), 0, BufferUtil.ENDIAN.LITTLE))
				.to.be.equal(3.820471434542632e-37);
		});
	});

	describe('#readInt8()', () => {
		it('should read positive number correctly', () => {
			expect(BufferUtil.readInt8(Buffer.from([0x33]), 0))
				.to.be.equal(51);
		});

		it('should read negative number correctly', () => {
			expect(BufferUtil.readInt8(Buffer.from([0xAA]), 0))
				.to.be.equal(-86);
		});
	});

	describe('#readUInt8()', () => {
		it('should read low number correctly', () => {
			expect(BufferUtil.readUInt8(Buffer.from([0x33]), 0))
				.to.be.equal(51);
		});

		it('should read high number correctly', () => {
			// Test this because 0xAA on a normal int8 is -86, but this is unsigned
			expect(BufferUtil.readUInt8(Buffer.from([0xAA]), 0))
				.to.be.equal(170);
		});
	});

	describe('#readInt16()', () => {
		describe("big endian", () => {
			it('should read low number correctly', () => {
				expect(BufferUtil.readInt16(Buffer.from([0x11, 0xFF]), 0, BufferUtil.ENDIAN.BIG))
					.to.be.equal(4607);
			});

			it('should read high number correctly', () => {
				expect(BufferUtil.readInt16(Buffer.from([0xFF, 0x11]), 0, BufferUtil.ENDIAN.BIG))
					.to.be.equal(-239);
			});
		});

		describe("little endian", () => {
			it('should read low number correctly', () => {
				expect(BufferUtil.readInt16(Buffer.from([0xFF, 0x11]), 0, BufferUtil.ENDIAN.LITTLE))
					.to.be.equal(4607);
			});

			it('should read high number correctly', () => {
				expect(BufferUtil.readInt16(Buffer.from([0x11, 0xFF]), 0, BufferUtil.ENDIAN.LITTLE))
					.to.be.equal(-239);
			});
		});
	});

	describe('#readUInt16()', () => {
		describe("big endian", () => {
			it('should read low number correctly', () => {
				expect(BufferUtil.readUInt16(Buffer.from([0x11, 0xFF]), 0, BufferUtil.ENDIAN.BIG))
					.to.be.equal(4607);
			});

			it('should read high number correctly', () => {
				expect(BufferUtil.readUInt16(Buffer.from([0xFF, 0x11]), 0, BufferUtil.ENDIAN.BIG))
					.to.be.equal(65297);
			});
		});

		describe("little endian", () => {
			it('should read low number correctly', () => {
				expect(BufferUtil.readUInt16(Buffer.from([0xFF, 0x11]), 0, BufferUtil.ENDIAN.LITTLE))
					.to.be.equal(4607);
			});

			it('should read high number correctly', () => {
				expect(BufferUtil.readUInt16(Buffer.from([0x11, 0xFF]), 0, BufferUtil.ENDIAN.LITTLE))
					.to.be.equal(65297);
			});
		});
	});

	describe('#readInt32()', () => {
		describe("big endian", () => {
			it('should read low number correctly', () => {
				expect(BufferUtil.readInt32(Buffer.from([0x11, 0x55, 0x20, 0x09]), 0, BufferUtil.ENDIAN.BIG))
					.to.be.equal(290791433);
			});

			it('should read high number correctly', () => {
				expect(BufferUtil.readInt32(Buffer.from([0xff, 0xaf, 0x01, 0x94]), 0, BufferUtil.ENDIAN.BIG))
					.to.be.equal(-5308012);
			});
		});

		describe("little endian", () => {
			it('should read low number correctly', () => {
				expect(BufferUtil.readInt32(Buffer.from([0x11, 0x55, 0x20, 0x09]), 0, BufferUtil.ENDIAN.LITTLE))
					.to.be.equal(153113873);
			});

			it('should read high number correctly', () => {
				expect(BufferUtil.readInt32(Buffer.from([0xff, 0xaf, 0x01, 0x94]), 0, BufferUtil.ENDIAN.LITTLE))
					.to.be.equal(-1811828737);
			});
		});
	});

	describe('#readUInt32()', () => {
		describe("big endian", () => {
			it('should read low number correctly', () => {
				expect(BufferUtil.readUInt32(Buffer.from([0x11, 0x55, 0x20, 0x09]), 0, BufferUtil.ENDIAN.BIG))
					.to.be.equal(290791433);
			});

			it('should read high number correctly', () => {
				expect(BufferUtil.readUInt32(Buffer.from([0xff, 0xaf, 0x01, 0x94]), 0, BufferUtil.ENDIAN.BIG))
					.to.be.equal(4289659284);
			});
		});

		describe("little endian", () => {
			it('should read low number correctly', () => {
				expect(BufferUtil.readUInt32(Buffer.from([0x11, 0x55, 0x20, 0x09]), 0, BufferUtil.ENDIAN.LITTLE))
					.to.be.equal(153113873);
			});

			it('should read high number correctly', () => {
				expect(BufferUtil.readUInt32(Buffer.from([0xff, 0xaf, 0x01, 0x94]), 0, BufferUtil.ENDIAN.LITTLE))
					.to.be.equal(2483138559);
			});
		});
	});

	describe('#slice()', () => {
		let testBuffer = Buffer.from([0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff]);
		let nothingSliced = BufferUtil.slice(testBuffer, 0);

		it("slicing away nothing returns the same number of bytes", () => {
			expect(nothingSliced.length).to.be.equal(testBuffer.length);
		});

		it("slicing away nothing returns a different buffer", () => {
			expect(nothingSliced).to.not.be.equal(testBuffer);
		});

		it("slicing returns a buffer", () => {
			expect(nothingSliced).to.be.instanceOf(Buffer);
		});

		it("slicing away all returns a buffer with nothing", () => {
			expect(BufferUtil.slice(testBuffer, 0, 0).length).to.be.equal(0);
		});

		it("returns the proper slice on an offset of 1", () => {
			expect(BufferUtil.slice(testBuffer, 1).equals(Buffer.from([0xbb, 0xcc, 0xdd, 0xee, 0xff])))
				.to.be.equal(true);
		});

		it("returns the proper slice on an ending of length-1", () => {
			expect(BufferUtil.slice(testBuffer, 0, testBuffer.length - 1).equals(Buffer.from([0xaa, 0xbb, 0xcc, 0xdd, 0xee])))
				.to.be.equal(true);
		});
	});

	describe('#values()', () => {
		it("returns an iterator", () => {
			// need some way to test if its an iterator instance
		});

		describe("has correct properties on iterator", () => {
			it("main iterator has next property", () => {
				expect('next' in BufferUtil.values(Buffer.alloc(4))).to.be.equal(true);
			})

			describe("has correct properties on iterator next()", () => {
				it("iterator next() has value property", () => {
					expect('value' in (BufferUtil.values(Buffer.alloc(4)).next()))
						.to.be.equal(true);
				});

				it("iterator next() has done property", () => {
					expect('done' in (BufferUtil.values(Buffer.alloc(4)).next()))
						.to.be.equal(true);
				});
			});
		});
	});

	describe('#valuesArray()', () => {
		describe("returns an array properly", () => {
			it("returns an array", () => {
				expect(Array.isArray(BufferUtil.valuesArray(Buffer.alloc(4)))).to.be.equal(true);
			});

			it("returns the proper amount of entries", () => {
				expect(BufferUtil.valuesArray(Buffer.alloc(4)).length).to.be.equal(4);
			});
		});
	});

	describe("#writeString()", () => {
		it("writes one character string correctly", () => {
			let testBuffer = Buffer.from('teST');

			BufferUtil.writeString(testBuffer, 'orEO', 0);

			expect(testBuffer.equals(Buffer.from('orEO'))).to.be.equal(true);
		});
	});

	describe('#writeDouble()', () => {
		describe("big endian", () => {
			it("writes absurdly large number", () => {
				let testBuffer = Buffer.alloc(16);

				BufferUtil.writeDouble(
					testBuffer, 
					0, 
					9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999,
					BufferUtil.ENDIAN.BIG	
				);

				expect(testBuffer.readDoubleBE(0)).to.be.equal(1e+124);
			});

			it("writes small number", () => {
				let testBuffer = Buffer.alloc(16);

				BufferUtil.writeDouble(
					testBuffer,
					0,
					0.00003,
					BufferUtil.ENDIAN.BIG
				);

				expect(testBuffer.readDoubleBE(0)).to.be.equal(0.00003);
			});
		});

		describe("little endian", () => {
			it("writes absurdly large number", () => {
				let testBuffer = Buffer.alloc(16);

				BufferUtil.writeDouble(
					testBuffer, 
					0, 
					9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999,
					BufferUtil.ENDIAN.LITTLE	
				);

				expect(testBuffer.readDoubleLE(0)).to.be.equal(1e+124);
			});

			it("writes small number", () => {
				let testBuffer = Buffer.alloc(16);

				BufferUtil.writeDouble(
					testBuffer,
					0,
					0.00003,
					BufferUtil.ENDIAN.LITTLE
				);

				expect(testBuffer.readDoubleLE(0)).to.be.equal(0.00003);
			});
		});
	});

	describe('#writeFloat()', () => {
		describe("big endian", () => {
			it("writes absurdly large number", () => {
				let testBuffer = Buffer.alloc(16);

				BufferUtil.writeFloat(
					testBuffer, 
					0, 
					999999,
					BufferUtil.ENDIAN.BIG	
				);

				expect(testBuffer.readFloatBE(0)).to.be.equal(999999);
			});

			it("writes small number", () => {
				let testBuffer = Buffer.alloc(16);

				BufferUtil.writeFloat(
					testBuffer,
					0,
					0.10000000149011612,
					BufferUtil.ENDIAN.BIG
				);

				expect(testBuffer.readFloatBE(0)).to.be.equal(0.10000000149011612);
			});
		});

		describe("little endian", () => {
			it("writes large number", () => {
				let testBuffer = Buffer.alloc(16);

				BufferUtil.writeFloat(
					testBuffer, 
					0, 
					999999,
					BufferUtil.ENDIAN.LITTLE	
				);

				expect(testBuffer.readFloatLE(0)).to.be.equal(999999);
			});

			it("writes small number", () => {
				let testBuffer = Buffer.alloc(16);

				BufferUtil.writeFloat(
					testBuffer,
					0,
					0.10000000149011612,
					BufferUtil.ENDIAN.LITTLE
				);

				expect(testBuffer.readFloatLE(0)).to.be.equal(0.10000000149011612);
			});
		});
	});

	describe('#writeInt8()', () => {
		it("should write low number correctly", () => {
			let testBuffer = Buffer.alloc(4);

			BufferUtil.writeInt8(testBuffer, 0, 20);

			expect(testBuffer.readInt8(0)).to.be.equal(20);
		});

		it("should write negative number correctly", () => {
			let testBuffer = Buffer.alloc(4);

			BufferUtil.writeInt8(testBuffer, 0, -24);

			expect(testBuffer.readInt8(0)).to.be.equal(-24);
		});
	});

	describe('#writeUInt8()', () => {
		it("should write low number correctly", () => {
			let testBuffer = Buffer.alloc(4);

			BufferUtil.writeUInt8(testBuffer, 0, 20);

			expect(testBuffer.readUInt8(0)).to.be.equal(20);
		});

		it("should write high number correctly", () => {
			let testBuffer = Buffer.alloc(4);

			BufferUtil.writeUInt8(testBuffer, 0, 232);

			expect(testBuffer.readUInt8(0)).to.be.equal(232);
		})
	});

	describe('#writeInt16()', () => {
		describe("big endian", () => {
			it("should write low number correctly", () => {
				let testBuffer = Buffer.alloc(4);

				BufferUtil.writeInt16(testBuffer, 0, 10953, BufferUtil.ENDIAN.BIG);

				expect(testBuffer.readInt16BE(0)).to.be.equal(10953);
			});

			it("should write negative number correctly", () => {
				let testBuffer = Buffer.alloc(4);

				BufferUtil.writeInt16(testBuffer, 0, -10953, BufferUtil.ENDIAN.BIG);

				expect(testBuffer.readInt16BE(0)).to.be.equal(-10953);
			});
		});

		describe("little endian", () => {
			it("should write low number correctly", () => {
				let testBuffer = Buffer.alloc(4);

				BufferUtil.writeInt16(testBuffer, 0, 10953, BufferUtil.ENDIAN.LITTLE);

				expect(testBuffer.readInt16LE(0)).to.be.equal(10953);
			});

			it("should write negative number correctly", () => {
				let testBuffer = Buffer.alloc(4);

				BufferUtil.writeInt16(testBuffer, 0, -10953, BufferUtil.ENDIAN.LITTLE);

				expect(testBuffer.readInt16LE(0)).to.be.equal(-10953);
			});
		});
	});

	describe('#writeUInt16()', () => {
		describe("big endian", () => {
			it("should write low number correctly", () => {
				let testBuffer = Buffer.alloc(4);

				BufferUtil.writeUInt16(testBuffer, 0, 10953, BufferUtil.ENDIAN.BIG);

				expect(testBuffer.readUInt16BE(0)).to.be.equal(10953);
			});

			it("should write large number correctly", () => {
				let testBuffer = Buffer.alloc(4);

				BufferUtil.writeUInt16(testBuffer, 0, 32522, BufferUtil.ENDIAN.BIG);

				expect(testBuffer.readUInt16BE(0)).to.be.equal(32522);
			});
		});

		describe("little endian", () => {
			it("should write low number correctly", () => {
				let testBuffer = Buffer.alloc(4);

				BufferUtil.writeUInt16(testBuffer, 0, 10953, BufferUtil.ENDIAN.LITTLE);

				expect(testBuffer.readUInt16LE(0)).to.be.equal(10953);
			});

			it("should write large number correctly", () => {
				let testBuffer = Buffer.alloc(4);

				BufferUtil.writeUInt16(testBuffer, 0, 32522, BufferUtil.ENDIAN.LITTLE);

				expect(testBuffer.readUInt16LE(0)).to.be.equal(32522);
			});
		});
	});

	describe('#writeInt32()', () => {
		describe("big endian", () => {
			it("should write low number correctly", () => {
				let testBuffer = Buffer.alloc(4);

				BufferUtil.writeInt32(testBuffer, 0, 1095300, BufferUtil.ENDIAN.BIG);

				expect(testBuffer.readInt32BE(0)).to.be.equal(1095300);
			});

			it("should write negative number correctly", () => {
				let testBuffer = Buffer.alloc(4);

				BufferUtil.writeInt32(testBuffer, 0, -1095300, BufferUtil.ENDIAN.BIG);

				expect(testBuffer.readInt32BE(0)).to.be.equal(-1095300);
			});
		});

		describe("little endian", () => {
			it("should write low number correctly", () => {
				let testBuffer = Buffer.alloc(4);

				BufferUtil.writeInt32(testBuffer, 0, 1095300, BufferUtil.ENDIAN.LITTLE);

				expect(testBuffer.readInt32LE(0)).to.be.equal(1095300);
			});

			it("should write negative number correctly", () => {
				let testBuffer = Buffer.alloc(4);

				BufferUtil.writeInt32(testBuffer, 0, -1095300, BufferUtil.ENDIAN.LITTLE);

				expect(testBuffer.readInt32LE(0)).to.be.equal(-1095300);
			});
		});
	});

	describe('#writeUInt32()', () => {

	});

	describe('#writeBigInt()', () => {

	});

	describe('#writeArbBitInt()', () => {

	});

	describe('#writeArbBitUInt()', () => {

	});

	describe('#writeInt64()', () => {

	});

	describe("#writeUInt64()", () => {

	});

	describe('#writeInt128()', () => {

	});

	describe('#writeUInt128()', () => {

	});

	describe('#readBigInt()', () => {

	});

	describe('#readArbBitInt', () => {

	});

	describe('#readArbBitUInt', () => {

	});

	describe('#readInt64()', () => {

	});

	describe('#readUInt64()', () => {

	});

	describe('#readInt128()', () => {

	});

	describe('#readUInt128()', () => {

	});
});

describe('Idle', () => {
	describe("#Idle()", () => {
		let calledTimes = 0;
		let testIdle = Idle.Idle(() => {
			calledTimes++;

			return 5;
		});

		it("should be a function", () => {
			expect(testIdle).to.be.a('function');
		});

		it("should call function", () => {
			let prevValue = calledTimes;

			testIdle();

			expect(calledTimes).to.be.equal(prevValue + 1);
		});

		it("should return value", () => {
			expect(testIdle()).to.be.equal(5);
		});
	});

	describe('#AsyncIdle', () => {
		let calledTimes = 0;
		let testIdle = Idle.AsyncIdle(() => {
			calledTimes++;

			return 5;
		});

		it("should be a function", () => {
			expect(testIdle).to.be.a('function');
		});

		it('should call function', async () => {
			let prevValue = calledTimes;

			await testIdle();

			expect(calledTimes).to.be.equal(prevValue + 1);
		});

		it("should return a promise", () => {
			expect(testIdle()).to.be.a.instanceOf(Promise);
		});

		it('should return a value', async () => {
			expect(await testIdle()).to.be.equal(5);
		});
	});
});

describe('BufferWrap', () => {
	let testBWrap = new BufferWrap();

	describe("#constructor()", () => {
		it('_buffer should be null', () => {
			expect(testBWrap._buffer).to.be.equal(null);
		});

		it('defaultEndian should be BIG ENDIAN', () => {
			expect(testBWrap.defaultEndian).to.be.equal(BufferUtil.ENDIAN.BIG);
		});
	});

	describe('instance#resetBuffer()', () => {
		it('should reset the buffer to null', () => {
			testBWrap.resetBuffer();

			expect(testBWrap._buffer).to.be.equal(null);
		});
	});

	describe('instance#clearBuffer()', () => {
		it("should clear the buffer", () => {
			testBWrap._buffer = Buffer.from([0xAA, 0x00, 0xBB]);

			testBWrap.clearBuffer();

			for (let i = 0; i < testBWrap._buffer.length; i++) {
				expect(testBWrap._buffer[i]).to.be.equal(0x00);
			}
		});
	});

	describe('instance#swapBuffer()', () => {
		it('should replace _buffer with Buffer instance', () => {
			let testBuffer = Buffer.from([0xaa, 0xbb, 0xaa, 0xcc]);

			testBWrap.swapBuffer(testBuffer);

			expect(testBWrap._buffer).to.be.equal(testBuffer);
		});

		it('should replace _buffer with Buffer instance of BufferWrap instance', () => {
			let tempTestBWrap = new BufferWrap();
			tempTestBWrap._buffer = Buffer.alloc(1);

			testBWrap.swapBuffer(tempTestBWrap);

			expect(testBWrap._buffer).to.be.equal(tempTestBWrap._buffer);
		});

		it('should throw on non-Buffer/BufferWrap', () => {
			expect(() => testBWrap.swapBuffer('i am not a buffer :(')).to.throw();
		});
	});

	describe('instance#setEndian()', () => {
		describe("should set endian by endian enum correctly", () => {
			it("big endian", () => {
				testBWrap.setEndian(BufferUtil.ENDIAN.BIG);

				expect(testBWrap.defaultEndian).to.be.equal(BufferUtil.ENDIAN.BIG);
			});

			it("little endian", () => {
				testBWrap.setEndian(BufferUtil.ENDIAN.LITTLE);

				expect(testBWrap.defaultEndian).to.be.equal(BufferUtil.ENDIAN.LITTLE);
			});
		});

		describe("should set endian using strings correctly", () => {
			describe("big endian", () => {
				it("'big'", () => {
					testBWrap.setEndian('big');

					expect(testBWrap.defaultEndian).to.be.equal(BufferUtil.ENDIAN.BIG)
				});

				it("'bigendian'", () => {
					testBWrap.setEndian('bigendian');

					expect(testBWrap.defaultEndian).to.be.equal(BufferUtil.ENDIAN.BIG);
				});

				it("'big-endian'", () => {
					testBWrap.setEndian('big-endian');

					expect(testBWrap.defaultEndian).to.be.equal(BufferUtil.ENDIAN.BIG);
				});

				it("'big endian'", () => {
					testBWrap.setEndian('big endian');

					expect(testBWrap.defaultEndian).to.be.equal(BufferUtil.ENDIAN.BIG);
				});
			});

			describe('little endian', () => {
				it("'little'", () => {
					testBWrap.setEndian('little');

					expect(testBWrap.defaultEndian).to.be.equal(BufferUtil.ENDIAN.LITTLE);
				});

				it("'littleendian'", () => {
					testBWrap.setEndian('littleendian');

					expect(testBWrap.defaultEndian).to.be.equal(BufferUtil.ENDIAN.LITTLE);
				});

				it("'little-endian'", () => {
					testBWrap.setEndian('little-endian');

					expect(testBWrap.defaultEndian).to.be.equal(BufferUtil.ENDIAN.LITTLE);
				});

				it("'little endian'", () => {
					testBWrap.setEndian('little endian');

					expect(testBWrap.defaultEndian).to.be.equal(BufferUtil.ENDIAN.LITTLE);
				});
			});
		});

		describe("should throw", () => {
			it("incorrect enum number", () => {
				// 600 instead of something like 3 because it's less likely to be used in the future
				expect(() => testBWrap.setEndian(600)).to.throw();
			});

			it("incorrect string", () => {
				expect(() => testBWrap.setEndian("test")).to.throw();
			});
		});
	});

	describe("instance#flipEndian()", () => {
		it("flip endian from big endian", () => {
			testBWrap.setEndian(BufferUtil.ENDIAN.BIG);

			testBWrap.flipEndian();

			expect(testBWrap.defaultEndian).to.be.equal(BufferUtil.ENDIAN.LITTLE);
		});

		it("flip endian from little endian", () => {
			testBWrap.setEndian(BufferUtil.ENDIAN.LITTLE);

			testBWrap.flipEndian();

			expect(testBWrap.defaultEndian).to.be.equal(BufferUtil.ENDIAN.BIG);
		});

		// Somehow figure out that Err.FatalError was called
	});

	// This manageEndian is different from BufferUtil#manageEndian
	describe("instance#manageEndian", () => {
		let littleEndianFunction = (n=0) => 1 + n;
		let bigEndianFunction = (n=0) => 2 + n;

		it("runs big endian function when given big endian", () => {
			expect(testBWrap.manageEndian(bigEndianFunction, littleEndianFunction, BufferUtil.ENDIAN.BIG))
				.to.be.equal(2);
		});

		it("runs little endian function when given little endian", () => {
			expect(testBWrap.manageEndian(bigEndianFunction, littleEndianFunction, BufferUtil.ENDIAN.LITTLE))
				.to.be.equal(1);
		});

		it("passes arguments to big endian function when given big endian", () => {
			expect(testBWrap.manageEndian(bigEndianFunction, littleEndianFunction, BufferUtil.ENDIAN.BIG, 5))
				.to.be.equal(7);
		});

		it("passes arguments to little endian function when given little endian", () => {
			expect(testBWrap.manageEndian(bigEndianFunction, littleEndianFunction, BufferUtil.ENDIAN.LITTLE, 5))
				.to.be.equal(6);
		});

		it("throws on incorrect endianness", () => {
			expect(() => testBWrap.manageEndian(bigEndianFunction, littleEndianFunction, 600))
				.to.throw();
		});
	});
});

describe('UIStructure', () => {
	describe("#isFlag()", () => {
		it("01 00 is false", () => {
			expect(Struct.isFlag(0b01, 0b00)).to.be.equal(false);
		});

		it("01 01 is true", () => {
			expect(Struct.isFlag(0b01, 0b01)).to.be.equal(true);
		});

		it("00 01 is false", () => {
			expect(Struct.isFlag(0b00, 0b01)).to.be.equal(false);
		});

		it("10 00 is false", () => {
			expect(Struct.isFlag(0b10, 0b00)).to.be.equal(false);
		});

		it("10 010 is true", () => {
			expect(Struct.isFlag(0b10, 0b010)).to.be.equal(true);
		});

		it("11 01 is true", () => {
			expect(Struct.isFlag(0b11, 0b01)).to.be.equal(true);
		});

		it("11 10 is true", () => {
			expect(Struct.isFlag(0b11, 0b10)).to.be.equal(true);
		});

		it("100 000 is false", () => {
			expect(Struct.isFlag(0b100, 0b000)).to.be.equal(false);
		});

		it("100 111 is true", () => {
			expect(Struct.isFlag(0b100, 0b111)).to.be.equal(true);
		});
	});

	describe("#constructFlag()", () => {
		describe("MSB (Most Significant Bit)", () => {
			it("byte 0", () => {
				expect(Struct.constructFlag(0, "MSB")).to.be.equal(0b10000000);
			});
			
			it("byte 1", () => {
				expect(Struct.constructFlag(1, "MSB")).to.be.equal(0b01000000);
			});

			it("byte 2", () => {
				expect(Struct.constructFlag(2, "MSB")).to.be.equal(0b00100000);
			});

			it("byte 3", () => {
				expect(Struct.constructFlag(3, "MSB")).to.be.equal(0b00010000);
			});

			it("byte 4", () => {
				expect(Struct.constructFlag(4, "MSB")).to.be.equal(0b00001000);
			});

			it("byte 5", () => {
				expect(Struct.constructFlag(5, "MSB")).to.be.equal(0b00000100);
			});

			it("byte 6", () => {
				expect(Struct.constructFlag(6, "MSB")).to.be.equal(0b00000010);
			});

			it("byte 7", () => {
				expect(Struct.constructFlag(7, "MSB")).to.be.equal(0b00000001);
			});
		});

		describe("LSB (Least Significant Bit)", () => {
			it("byte 0", () => {
				expect(Struct.constructFlag(0, "LSB")).to.be.equal(0b00000001);
			});
			
			it("byte 1", () => {
				expect(Struct.constructFlag(1, "LSB")).to.be.equal(0b00000010);
			});

			it("byte 2", () => {
				expect(Struct.constructFlag(2, "LSB")).to.be.equal(0b00000100);
			});

			it("byte 3", () => {
				expect(Struct.constructFlag(3, "LSB")).to.be.equal(0b00001000);
			});

			it("byte 4", () => {
				expect(Struct.constructFlag(4, "LSB")).to.be.equal(0b00010000);
			});

			it("byte 5", () => {
				expect(Struct.constructFlag(5, "LSB")).to.be.equal(0b00100000);
			});

			it("byte 6", () => {
				expect(Struct.constructFlag(6, "LSB")).to.be.equal(0b01000000);
			});

			it("byte 7", () => {
				expect(Struct.constructFlag(7, "LSB")).to.be.equal(0b10000000);
			});
		});
	});

	describe("#removeNullProperties()", () => {
		it("empty object is unchanged", () => {
			let obj = {};
			let keyCount = Object.keys(obj).length;

			expect(keyCount).to.be.equal(Object.keys(Struct.removeNullProperties(obj)).length);
		});

		it("object with properties with undefined value", () => {
			let obj = Struct.removeNullProperties({
				a: undefined,
				b: undefined,
			});

			// using 'in' because they would be deleted if they got caught
			expect('a' in obj).to.be.equal(true);
			expect('b' in obj).to.be.equal(true);
		});

		it("class instance with null properties", () => {
			const Temp = class {
				constructor () {
					this.a = null;
					this.b = 5;
				}

				get c () {
					return null;
				}
			}

			let instance = Struct.removeNullProperties(new Temp());

			expect('a' in instance).to.be.equal(false);
			expect('b' in instance).to.be.equal(true);
			expect('c' in instance).to.be.equal(true);
		});

		it("normal function", () => {
			const func = function() {
				return 5 + 3;
			};
			const keyCount = Object.keys(func).length;

			expect(Object.keys(Struct.removeNullProperties(func)).length)
				.to.be.equal(keyCount);
		});

		it("an object with a mix of null and normal properties", () => {
			let obj = {
				name: null,
				abc: undefined,
				null: 5,
				test: '',
				line: false,
				another: null
			};

			Struct.removeNullProperties(obj);

			expect('name' in obj).to.be.equal(false);
			expect('abc' in obj).to.be.equal(true);
			expect('null' in obj).to.be.equal(true);
			expect('test' in obj).to.be.equal(true);
			expect('line' in obj).to.be.equal(true);
			expect('another' in obj).to.be.equal(false);
		});
	});

	describe("#Structure", () => {
		let testInstance = new Struct.Structure();

		describe("#constructor()", () => {
			it("#name is null", () => {
				expect(testInstance.name).to.be.equal(null);
			});

			it("#structureItems is an array", () => {
				expect(Array.isArray(testInstance.structureItems)).to.be.equal(true);
			});

			it("#isItem is false", () => {
				expect(testInstance.isItem).to.be.equal(false);
			});

			it("#parentItem is null", () => {
				expect(testInstance.parentItem).to.be.equal(null);
			});

			it("#parentStruct is null", () => {
				expect(testInstance.parentStruct).to.be.equal(null);
			});
		});


		let testItem1 = new Struct.StructureItem();
		let testItem2 = new Struct.ByteStructureItem(0, 1);

		testInstance.structureItems.push(testItem1, testItem2)

		describe("instance#findItemsBeforeItem()", () => {
			let result = testInstance.findItemsBeforeItem(testItem2);

			it("result is an array", () => {
				expect(Array.isArray(result)).to.be.equal(true);
			});

			it("results in one item before it", () => {
				expect(result.length).to.be.equal(1);
			});

			it("only item is the item before it", () => {
				expect(result[0]).to.be.equal(testItem1);
			});
		});

		describe("instance#clear()", () => {
			it("clears structure items", () => {
				// One of the properties cleared in a ByteStructureItem
				testItem2._calculatedOffset = 3;

				testInstance.clear();

				expect(testItem2._calculatedOffset).to.be.equal(null);
			});

			it("sets parentStruct to null if isItem is true", () => {
				let testInstance2 = new Struct.Structure();
				testInstance2.isItem = true;
				testInstance2.parentStruct = new Struct.Structure();

				testInstance2.clear();

				expect(testInstance2.parentStruct).to.be.equal(null);
			});
		});

		describe("instance#calculate()", () => {
			// TODO: write these tests
		});

		describe("instance#clone()", () => {
			let cloned = testInstance.clone();

			it("returns instance of Structure", () => {
				expect(cloned instanceof Struct.Structure).to.be.equal(true);
			});

			it("name is same as clone", () => {
				expect(cloned.name).to.be.equal(testInstance.name);
			});

			it("structureItems amount is the same as clone", () => {
				expect(cloned.structureItems.length).to.be.equal(testInstance.structureItems.length);
			});

			it("isItem is the same as clone", () => {
				expect(cloned.isItem).to.be.equal(testInstance.isItem);
			});

			it("parentItem is the same as clone", () => {
				expect(cloned.parentItem).to.be.equal(testInstance.parentItem);
			});
		});

		describe("instance#toJSON()", () => {
			let result = testInstance.toJSON();

			it("returns an object", () => {
				expect(result).to.be.a("object");
				expect(result.constructor).to.be.equal(Object);
			});

			it("name is same as original", () => {
				// Should be false, because name was null and thus should be removed
				expect('name' in result).to.be.equal(false);
			});

			it("structureItems amount is the same as original", () => {
				expect(result.structureItems.length).to.be.equal(testInstance.structureItems.length);
			});

			it("isItem is the same as original", () => {
				expect(result.isItem).to.be.equal(testInstance.isItem);
			});

			it("does not have a parentItem property", () => {
				expect(result).does.not.haveOwnProperty("parentItem");
			});

			it("does not have a parentStruct property", () => {
				expect(result).does.not.haveOwnProperty("parentStruct");
			});
		});

		describe("#fromJSON()", () => {
			// TODO
		});
	});

	describe("#StructureItem", () => {
		let testInstance = new Struct.Structure();

		let testItem1 = new Struct.StructureItem();

		testInstance.structureItems.push(testItem1);

		describe ("#constructor()", () => {
			it("type is string", () => {
				expect(testItem1.type).to.be.a('string');
			});

			it("type is 'item'", () => {
				expect(testItem1.type).to.be.equal('item');
			});

			it("name is null", () => {
				expect(testItem1.name).to.be.equal(null);
			});
		});

		describe("instance#isCalculated()", () => {
			it("returns true");
		});

		describe("instance#calculate()", () => {
			it("returns 0", () => {
				expect(testItem1.calculate(testInstance, Buffer.alloc(1), 0))
					.to.be.equal(0);
			});
		});

		describe("instance#clear()", () => {
			it("returns nothing", () => {
				expect(testItem1.clear()).to.be.equal(undefined);
			});
		});

		describe("instance#clone()", () => {
			let cloned = testItem1.clone();

			it("returns a different instance", () => {
				expect(cloned).to.not.be.equal(testItem1);
			});

			it("keeps type", () => {
				expect(cloned.type).to.be.equal(testItem1.type);
			});

			it("keeps name", () => {
				expect(cloned.name).to.be.equal(testItem1.name);
			});
		});

		let jsonResult = testItem1.toJSON();

		describe("instance#toJSON()", () => {
			it("returns an object", () => {
				expect(jsonResult).to.be.a('object');
			});

			it("returned value has type property", () => {
				expect(jsonResult).haveOwnProperty('type');
			});

			it("returned value has name property", () => {
				expect(jsonResult).haveOwnProperty('name');
			});
		});

		describe("#fromJSON()", () => {
			let result = Struct.StructureItem.fromJSON(jsonResult);

			it("returns StructureItem instance", () => {
				expect(result).to.be.an.instanceof(Struct.StructureItem);
			});

			it("sets type", () => {
				expect(result).to.haveOwnProperty('type');
			});

			it("sets name", () => {
				expect(result).to.haveOwnProperty('name');
			});
		});
	});

	describe("#ByteStructureItem", () => {
		describe("#constructor()", () => {
			it("type is string");

			it("type is 'byte'");

			it("offset is null when passed nothing");

			it("offset is number when passed number");

			it("offset is string when passed string");

			it("_calculatedOffset is null");

			it ("size is 1 when passed nothing");

			it("size is number when passed number");

			it("size is string when passed string")

			it("_calculatedSize is null");

			it("_data is null");

			it("_calculated is a boolean");

			it("_calculated is false");

			it("endian is Big Endian");
		});

		describe("instance#get value()", () => {
			it("returns _data");

			it("cannot set");
		});

		describe("instance#isCalculated()", () => {
			it("returns _calculated");

			it("returns boolean");
		});

		// Should I test really private methods? Since they might be removed at a whim?
		describe("instance#__calculateMathScope()", () => {
			it("gets all items before the current item that have a name");

			it("has no BigInts");

			it("returns an object");
		});

		describe("instance#__calculateProp()", () => {
			describe("returns", () => {
				describe("number", () => {
					it("when passed number");

					it("when passed math");
				});
			});
		});

		describe("instance#calculate()", () => {
			it("returns number");

			it("sets _calculated to true");

			it("sets _data to Buffer");
		});

		describe("instance#clear()", () => {
			it("returns nothing");

			it("sets _calculatedOffset to null");

			it("sets _calculatedSize to null");

			it("sets _data to null");

			it("sets _calculated to false");
		});
	});

	describe("#BitFlagStructureItem", () => {
		describe("#constructor()", () => {
			it("type is a string");

			it("type is 'bitflag'");

			it("numbering is 'MSB'");

			describe("flags is an object", () => {
				it("when passed nothing");

				it("when passed an object");

				it("when passed null");
			});

			it("_calculatedFlags is an object");
		});

		describe("instance#get value()", () => {
			it("returns _calculatedFlags");

			it("returns an object");

			it("cannot set");
		});

		describe("instance#clear()", () => {
			it("resets _calculatedFlags to an empty object");

			it("returns nothing");
		});

		describe("instance#__calculateFlag()", () => {
			it("returns boolean");
		});

		describe("instance#calculate()", () => {
			it("returns a number");

			it("sets no flags if there is no flags");

			it("sets flags if there is flags");
		});
	});

	describe("#IntStructureItem", () => {
		describe("#constructor()", () => {
			it("type is a string");

			it("type is 'int'");

			it("bitCount is a number");

			it("signed is a boolean");

			it("_value is null");
		});

		describe("instance#clear()", () => {
			it("_value is set to null");
		});

		describe("instance#get size()", () => {
			it("returns a number if bitCount is a number");
		});

		describe("instance#set size()", () => {
			it("does nothing");
		});

		describe("instance#get value()", () => {
			it("returns a BigInt");
		});

		describe("instance#toJSON()", () => {
			it("returns an object");

			it("returns an object without a size property");
		});
	});

	describe("#BoolStructureItem", () => {
		describe("#constructor()", () => {
			it("type is a string");

			it("loose is a boolean");

			it("_value is null");
		});

		describe("instance#clear()", () => {
			it("_value is set to null");
		});

		describe("instance#get value()", () => {
			it("if _calculated is false it will return null");

			it("if _value is null it will set it");

			it("if loose is true it will return a boolean");

			it("if loose is false then it can return a boolean or null");

			it("if loose is false and value is 0 it will return false");

			it("if loose is false and value is 1 it will return true");

			it("if loose is false and value is neither 0 or 1 it will return null");
		});
	});

	describe("#StringStructureItem", () => {
		describe("#constructor()", () => {
			it("type is string");

			it("type is 'string'");

			it("_value is null");
		});

		describe("instance#clear()", () => {
			it("_value is set to null");
		});

		describe("instance#get value()", () => {
			it("if _calculated is false then it will return null");

			it("if _value is null it will set it a value");

			it("will return a string");
		});
	});
});