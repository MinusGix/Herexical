const Log = require('./Log.js');
const BufUtil = require('./BufferUtil.js');
const mathjs = require('mathjs');

function isFlag (field, flag) {
	// 011001 field
	// 001000 flag that it's looking for
	// 001000 - true

	// 010001 field
	// 001000 flag that its looking for
	// 000000 - false
	return (field & flag) !== 0; // if It has the flag specified with a non zero value
}

function constructFlag (offset, numbering='MSB') {
	if (numbering === 'MSB') {
		switch (offset) {
			case 0:
				return 0b10000000;
			case 1:
				return 0b01000000;
			case 2:
				return 0b00100000;
			case 3:
				return 0b00010000;
			case 4:
				return 0b00001000;
			case 5:
				return 0b00000100;
			case 6:
				return 0b00000010;
			case 7:
				return 0b00000001;
			default:
				throw new Error("Unknown offset: " + offset);
		}
	} else if (numbering === 'LSB') {
		switch (offset) {
			case 0:
				return 0b00000001;
			case 1:
				return 0b00000010;
			case 2:
				return 0b00000100;
			case 3:
				return 0b00001000;
			case 4:
				return 0b00010000;
			case 5:
				return 0b00100000;
			case 6:
				return 0b01000000;
			case 7:
				return 0b10000000;
			default:
				throw new Error("Unknown offset: " + offset);
		}
	}
}

function removeNullProperties (obj) {
	for (let key in obj) {
		if (obj[key] === null) {
			delete obj[key];
		}
	}

	return obj;
}

class Structure {
	constructor () {
		this.name = null;

		this.structureItems = []; // StructureItem[]

		this.isItem = false;
		this.parentItem = null;
		// Set each time calculate is ran
		this.parentStruct = null;
	}

	findItemsBeforeItem (item) {
		let ret = [];

		if (this.isItem) {
			ret.push(...this.parentStruct.findItemsBeforeItem(this.parentItem));
		}

		for (let i = 0; i < this.structureItems.length; i++) {
			if (this.structureItems[i] === item) {
				break;
			}

			ret.push(this.structureItems[i]);
		}

		return ret;
	}

	// Clear all data that was calculated
	clear () {
		for (let i = 0; i < this.structureItems.length; i++) {
			this.structureItems[i].clear();
		}

		if (this.isItem) {
			this.parentStruct = null;
		}
	}

	calculate (buf, offsetIntoBuffer=0) {
		Log.timeStart('calculateData-' + this.name);

		for (let i = 0; i < this.structureItems.length; i++) {
			this.structureItems[i].calculate(this, buf, offsetIntoBuffer);
		}

		Log.timeEnd('calculateData-' + this.name);
	}

	clone () {
		let struct = new Structure();

		struct.name = this.name;
		struct.structureItems = this.structureItems
			.map(item => item.clone());
		struct.isItem = this.isItem;
		struct.parentItem = this.parentItem;
		console.log(struct.isItem, this.isItem);
		return struct;
	}

	toJSON () {
		let ret = {};

		ret.name = this.name;
		ret.structureItems = this.structureItems
			.map(item => item.toJSON());
		ret.isItem = this.isItem;

		return removeNullProperties(ret);;
	}

	static fromJSON (data) {
		let item = new this();

		for (let key in data) {
			if (key === 'structureItems') {
				for (let i = 0; i < data[key].length; i++) {
					let itemData = data[key][i];
					let type = itemData.type;

					let val = null;

					switch (type) {
						case 'item':
							val = StructureItem.fromJSON(item);
							break;
						case 'byte':
							val = ByteStructureItem.fromJSON(item);
							break;
						case 'bitflag':
							val = BitFlagStructureItem.fromJSON(item);
							break;
						case 'int':
							val = IntStructureItem.fromJSON(item);
							break;
						case 'bool':
							val = BoolStructureItem.fromJSON(item);
							break;
						case 'string':
							val = StringStructureItem.fromJSON(item);
							break;
						case 'structure':
							val = StructureStructureItem.fromJSON(item);
							break;
						default:
							throw new Error("Unknown StructureItem type: " + type);
					}

					item[key].push(val);
				}
			} else {
				item[key] = data[key];
			}
		}

		return item;
	}
}

class StructureItem {
	constructor () {
		this.type = 'item';
		this.name = null;
	}

	isCalculated () {
		return true;
	}

	calculate (struct, buf, offsetIntoBuffer) {
		return 0;
	}

	clear () {}

	clone () {
		return this.constructor.fromJSON(this.toJSON());
	}

	toJSON (notAllowedKeys=[], allowUnderscoreFields=false) {
		// Object.keys won't get functions, or getters, so we use it here
		let keys = Object.keys(this)
			.filter(key => {
				if (!allowUnderscoreFields && key.startsWith('_')) {
					return false;
				}

				return !notAllowedKeys.includes(key);
			});

		let ret = {};
		
		for (let i = 0; i < keys.length; i++) {
			ret[keys[i]] = this[keys[i]];
		}

		return ret;
	}

	static fromJSON (data) {
		let item = new this();

		for (let key in data) {
			item[key] = data[key];
		}

		return item;
	}
}

class ByteStructureItem extends StructureItem {
	constructor (offset=null, size=1) {
		super();

		this.type = 'byte';

		this.offset = offset;
		this._calculatedOffset = null;

		this.size = size;
		this._calculatedSize = null;

		this._data = null;
		this._calculated = false;

		this.endian = BufUtil.ENDIAN.BIG;
	}

	get value () {
		return this._data;
	}

	isCalculated () {
		return this._calculated;
	}

	__calculateMathScope (struct) {
		// Get all the variable values before this to pass to the equation
		// It would be nice if we could only pass what we
		return struct.findItemsBeforeItem(this)
			.filter(item => item.name !== null) // remove all unnamed variables
			.reduce ((obj, item) => { // turn it into an object for the scope
				obj[item.name] = item.value;

				// Convert bigints to numbers, because mathjs doesn't seem to support them
				if (typeof(obj[item.name]) === 'bigint') {
					obj[item.name] = Number(obj[item.name]);
				}

				return obj;
			}, {});
	}

	__calculateProp (value, struct) {
		let ret = null;

		// It's an equation
		if (typeof(value) === 'string') {
			// We can't just share the math scope between multiple calls of __calculateProp,
			// because an equation can modify the values of the scope (though, admittedly a shared scope between them could be useful?)
			ret = mathjs.eval(value, this.__calculateMathScope(struct));
		} else if (typeof(value) === 'number') {
			ret = value;
		}

		if (typeof(ret) !== 'number') {
			Log.warn("Prop value (or equation result) was not a number. Offending value:", value);
			ret = 0;
		}

		return ret;
	}

	calculate (struct, buf, offsetIntoBuffer) {
		this.clear();

		this._calculatedSize = this.__calculateProp(this.size, struct);

		this._calculatedOffset = this.__calculateProp(this.offset, struct);

		this._data = buf.slice(offsetIntoBuffer + this._calculatedOffset, offsetIntoBuffer + this._calculatedOffset + this._calculatedSize);

		this._calculated = true;

		return this._calculatedOffset + this._calculatedSize;
	}

	clear () {
		super.clear();

		this._calculatedOffset = null;
		this._calculatedSize = null;

		this._data = null;
		this._calculated = false;
	}
}

class BitFlagStructureItem extends ByteStructureItem {
	constructor (offset, flags={}, size=1) {
		super(offset, size);

		this.type = 'bitflag';

		// Valid values:
		// LSB: 76543210 - index
		//      10010110
		// MSB: 01234567 - index
		//		10010110
		this.numbering = 'MSB';

		this.flags = flags || {};
		this._calculatedFlags = {};
	}

	get value () {
		return this._calculatedFlags;
	}

	clear () {
		super.clear();

		this._calculatedFlags = {};
	}

	__calculateFlag (offset) {
		// The index into the this._data buffer for the byte to use
		// floor(0 / 8) -> 0
		// floor(7 / 8) -> 0
		// floor(8 / 8) -> 1 (which is what we want, because it's zero index so [7] is eigth bit and this is ninth)
		// floor (63 / 8) -> 7
		let itemIndex = Math.floor(offset / 8);

		if (this._data[itemIndex] === undefined) {
			return null;
		}

		return isFlag(
			this._data[itemIndex],
			constructFlag(offset % 8, this.numbering)
		);
	}

	calculate (struct, buf, offsetIntoBuffer) {
		let ret = super.calculate(struct, buf, offsetIntoBuffer);

		for (let flag in this.flags) {
			if (Array.isArray(this.flags[flag])) {
				this._calculatedFlags[flag] = this.flags[flag]
					.map(val => this.__calculateFlag(val));
			} else {
				this._calculatedFlags[flag] = this.__calculateFlag(this.flags[flag]);
			}
		}

		return ret;
	}
}

class IntStructureItem extends ByteStructureItem {
	constructor (offset=null, bitCount=8) {
		super(offset);

		this.type = 'int';

		this.bitCount = bitCount;
		this.signed = true;
		
		this._value = null;
	}

	clear () {
		super.clear();

		this._value = null;
	}

	get size () {
		return this.bitCount / 8;
	}

	// To make the constructor of ByteStructureItem quiet
	set size (_) {}

	get value () {
		if (!this._calculated) {
			return null;
		}

		// This would be a great spot for an Idle that can be revoked
		if (this._value === null) {
			this._value = BufUtil.readArbBitInt(this._data, 0, this.bitCount, this.endian);
		}

		return this._value;
	}

	toJSON () {
		// We disallow size, because it is inferred from bitCount
		return super.toJSON(['size']);
	}
}

// Extends ByteStructureItem rather than BitFlagStructureItem because we only need to check if its 0 or not
class BoolStructureItem extends ByteStructureItem {
	constructor (offset=null, loose=true) {
		super(offset, 1);

		this.type = 'bool';

		this.loose = loose;

		this._value = null;
	}

	clear () {
		super.clear();

		this._value = null;
	}

	get value () {
		if (!this._calculated) {
			return null;
		}

		if (this._value === null) {
			this._value = BufUtil.readUInt8(this._data, 0);
		}

		if (this.loose) {
			// It just had to be not 0 to be considered truthy
			return this._value !== 0x00;
		} else {
			if (this._value === 0x00) {
				return false;
			} else if (this._value === 0x01) {
				return true;
			} else {
				return null;
			}
		}
	}
}

class StringStructureItem extends ByteStructureItem {
	constructor (offset=null, size=0) {
		super(offset, size);

		this.type = 'string';

		this._value = null;
	}

	clear () {
		super.clear();

		this._value = null;
	}

	get value () {
		if (!this._calculated) {
			return null;
		}

		if (this._value === null) {
			this._value = this._data.toString();
		}

		return this._value;
	}
}

/*
class StructureStructureItem extends StructureItem {
	constructor (structure, amount=1) {
		super();

		this.type = 'structure';

		this._setupStructure(structure);
		this.amount = amount;

		this._data = [];
	}

	_setupStructure (structure=null) {
		if (structure instanceof Structure) {
			structure = structure.clone();

			structure.isItem = true;
			structure.parentItem = this;

			this.structure = structure;
		} else if (structure === null) { // if it's null, then just set it to null
			this.structure = null;
		} else {
			throw new TypeError("structure given to _setupStructure for StructureStructureIteM was not an instanceof Structure");
		}
	}

	clear () {
		super.clear();

		this._data = [];
	}

	// Copied from ByteStructureItem, would be nice to not repeat it
	__calculateMathScope (struct) {
		// Get all the variable values before this to pass to the equation
		// It would be nice if we could only pass what we
		return struct.findItemsBeforeItem(this)
			.filter(item => item.name !== null) // remove all unnamed variables
			.reduce ((obj, item) => { // turn it into an object for the scope
				obj[item.name] = item.value;

				// Convert bigints to numbers, because mathjs doesn't seem to support them
				if (typeof(obj[item.name]) === 'bigint') {
					obj[item.name] = Number(obj[item.name]);
				}

				return obj;
			}, {});
	}

	__calculateProp (value, struct) {
		let ret = null;

		// It's an equation
		if (typeof(value) === 'string') {
			// We can't just share the math scope between multiple calls of __calculateProp,
			// because an equation can modify the values of the scope (though, admittedly a shared scope between them could be useful?)
			ret = mathjs.eval(value, this.__calculateMathScope(struct));
		} else if (typeof(value) === 'number') {
			ret = value;
		}

		if (typeof(ret) !== 'number') {
			Log.warn("Prop value (or equation result) was not a number. Offending value:", value);
			ret = 0;
		}

		return ret;
	}

	get value () {
		return this._data;
	}

	calculate (struct, buf, offsetIntoBuffer) {
		this.clear();

		let amount = this.__calculateProp(this.amount, struct);
		let offset = offsetIntoBuffer;

		for (let i = 0; i < amount; i++) {
			let clonedStructure = this.structure.clone();
			clonedStructure.parentStruct = struct;
			
			let lastOffset = clonedStructure.calculate(buf, offset);
			offset += lastOffset;

			this._data.push(clonedStructure);
		}

		return
	}

	toJSON () {
		let ret = super.toJSON(['structure']);

		ret.structure = this.structure.toJSON();

		return ret;
	}

	static fromJSON (data) {
		let item = super.fromJSON(data);

		item._setupStructure(Structure.fromJSON(data.structure))

		return item;
	}
}*/

module.exports = {
	isFlag,
	constructFlag,
	removeNullProperties,
	Structure,
	
	StructureItem,
	ByteStructureItem,
	BitFlagStructureItem,
	IntStructureItem,
	BoolStructureItem,
	StringStructureItem,
	//StructureStructureItem,
};