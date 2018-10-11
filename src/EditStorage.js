/*
	This is very inefficient, but it's meant to be replaced later by a better more complex method of handling storing edits.
	The attempt here is to provide a complete 'api' (I can't think of a better term) that will behave the same even if we swap it out later

	The needs of this storage is:
		- Store the edits made to a file via their offsets into the file
		- Read quickly (since scrolling is done a lot in a hex editor, editing a hex file is done a bit less often at least in my personal use)
		- Write quickly (Less important than reading quickly, but it's still useful)
		- Async, even if the functions here aren't async so later when swapping out with code that might do more daring things that shouldn't be ran
			synchronously it will work just fine.
		- Be able to access a range of offsets, and get all the edits. Perhaps supply a buffer that it will edit with the needed replacements at offsets
		- Be memory efficient. It would be really really nice to have some form of compression to make storing large edits less of a pain.

	
	Ideas:
		- Store it as an array with many instances of [offset, value].
			It would be in order of precedence (just push newer changes to the end). One of them makes at an edit at 0x0010 to change it to FF
				A later one changes 0x0010 to FE, the later one takes precedence and the user never sees the display flicker between values
			In the background it will sometimes restructure the storage (the array of [offset, value]) to remove earlier edits that are superseded
			by later ones. This'll increase efficiency in reading. Especially, since if it's storing only single byte values then it's gonna have
			a ton of values.
			Unlikely to hit the max size of an array, even without optimization. A quick search says 
				`However, the maximum length of an array according to the ECMA-262 5th Edition specification is bound by an unsigned 32-bit integer 
				due to the ToUint32 abstract operation, so the longest possible array could have 2^32-1 = 4,294,967,295 = 4.29 billion elements`
				(stackoverflow)
			- Bonuses:
				- Fairly simple to implement.
				- If a program wanted to mess with it, it's easier to do things with
				- If you didn't optimize it, this could be used for a undo/redo storage. (Well it'd have to be extended)
			- Downsides:
				- Hard to compress (at least Im not coming up with anything good)
		- Same as above idea, but its stored as an array of (1) [offsetStart, offsetEnd, ...values] or (2) [offsetStart, offsetEnd, [values]] or might
			(3) [offsetStart, offsetEnd, value] (and just store value as a string of hex. number wouldn't work unless you used BigNum and split it 
			up into more)
			- Bonuses
				- (1,2,3) - Store more than one value per part of file. It's more likely that someone is editing multiple parts of a file in a nearby area
					rather than editing only one byte at a time (like the previous idea would do).
			- Downsides:
				- (3) - Have to make a function to grab things at a certain offset and extract that value from a number. Inefficient, but it shouldn't
					happen too often
				- (1,2,3) - Have to implement a function to find several instances which correspond to values in a range, grab them all together and 
					get the most important ones.
				- (1,2,3) - It becomes far more complex to manage optimization, as edits that intersect are likely to only intersect partially
		- Map/Object. Store an offset as a key (number/string) and get them as needed. Those that don't have a value just return undefined.
			This makes so there's no need for optimization like the first idea, well at least not in the same way. Sadly just like the first idea it doesn't
			have any special handling of a range of values which is going to be often used.
			I believe there's no limit on the keycount in an object. Not completely sure, and no clue about Map.
			- Bonuses
				- Fairly simple to implement
				- If a program wanted to mess with it, it's easier to do things with
				- No need for optimization (at least in the same way as idea #1), as when changing a key the last one is removed
			- Downsides
				- Hard to compress
		
			
*/

const EventEmitter = require('events');

// A class empty of actual storage functionality, a base class.
// Most if not all of the methods should return a promise (or be async) so that implementations that do stuff like write to file or use a db
//	can do that without need of modifying code
class EditStorage extends EventEmitter {
	constructor () {
		super();

		this.settings = {};

		// If a function to store a range of offsets is given something (offsetStart='019A2', offsetEnd='01000') then it's going back
		// if it is lenient, then it will simply swap those two values, otherwise it won't
		this.settings.lenientOffsetRangeStorage = false;
	}

	async writeBuffer (offsetStart, buf) {
		this.emit('writeBuffer', offsetStart, buf);
		
		let values = await this.getOffsetRange(offsetStart, offsetStart + buf.length);
		
		for (let i = 0; i < values.length; i++) {
			if (values[i] !== null && values[i] !== undefined) {
				buf[i] = values[i];
			}
		}

		return buf;
	}

	async optimize () {
		this.emit('optimize');
	}

	async storeOffset (offset, value) {
		this.emit('storeOffset', offset, value);
	}

	async storeOffsetRange (offsetStart, offsetEnd, values) {
		this.emit('storeOffsetRange', offsetStart, offsetEnd, value);

		if (offsetStart > offsetEnd) {
			if (this.settings.lenientOffsetRangeStorage) {
				throw new RangeError("offsetStart was earlier than offsetEnd, not allowed.")
			} else {
				// Be lenient and just swap them around
				return await this.storeOffsetRange(offsetEnd, offsetStart, values);
			}
		}

		const valuesIsArray = Array.isArray(values);

		if (isArray && values.length === 1) {
			values = values[0];
		}

		// This means that the start is the end. So there's only one value. A program that uses this might just call this whenever an edit is made
		if (offsetStart === offsetEnd) {
			let value;

			if (valuesIsArray) {
				value = values[0];
			} else {
				value = values;
			}

			return await this.storeOffset(offsetStart, value);
		}

		return await this._storeOffsetRange(offsetStart, offsetEnd, values);
	}

	// This is storeOffsetRange without any checks and is the actual code to store the offset range
	// An instance that stores each offset individually could probably leave this as default 
	// But an instance that is more efficient and stores offset ranges itself would want to modify this rather than storeOffsetRange
	async _storeOffsetRange (offsetStart, offsetEnd, values) {
		// Adds each and every offset from offsetStart and offsetEnd.

		const valuesIsArray = Array.isArray(values);

		for (let currentOffset = offsetStart; currentOffset <= offsetEnd; currentOffset += 1) {
			// TODO: add some complaining if the current index doesn't exist in the array
			if (valuesIsArray) {
				await this.storeOffset(n, values[currentOffset]);
			} else {
				await this.storeOffset(n, values);
			}
		}
	}

	async storeOffsets (offsetList, values) {
		this.emit('storeOffsets', offsetList, values);

		const valuesIsArray = Array.isArray(values);

		for (let i = 0; i < offsetList.length; i++) {
			let value;

			if (valuesIsArray) {
				value = values[index];
			} else {
				value = values;
			}

			await this.storeOffset(offset, value);
		}
	}

	async getOffset (offset) {
		this.emit('getOffset', offset);
	}

	async getOffsetRange (offsetStart, offsetEnd) {
		this.emit('getOffsetRange', offsetStart, offsetEnd);

		if (offsetStart > offsetEnd) {
			if (this.settings.lenientOffsetRangeStorage) {
				throw new RangeError("offsetStart was earlier than offsetEnd, not allowed.")
			} else {
				// Be lenient and just swap them around
				return await this.getOffsetRange(offsetEnd, offsetStart);
			}
		}

		// This means that the start is the end. So there's only one value. A program that uses this might just call this whenever an edit is made
		if (offsetStart === offsetEnd) {
			// Wrap it in an array because this function normally returns an array
			return [await this.getOffset(offsetStart)];
		}

		return await this._getOffsetRange(offsetStart, offsetEnd);
	}

	// This is getOffsetRange without any checks and is the actual code to grab the offset range
	// Just look at _storeOffsetRange comments
	// For instances that don't store each offset separately this will almost certainly have to be modified to be more efficient
	async _getOffsetRange (offsetStart, offsetEnd) {
		let values = [];

		for (let currentOffset = offsetStart; currentOffset <= offsetEnd; currentOffset += 1) {
			values.push(await this.getOffset(currentOffset));
		}

		return values;
	}

	async getOffsets (offsetList) {
		this.emit('getOffset', offsetList);

		let values = [];

		for (let i = 0; i < offsetList.length; i++) {
			values.push(await this.getOffset(offsetList[i]));
		}

		return values;
	}
}

// Idea #1 [offset, value][]
class ArrayOffsetEditStorage extends EditStorage {
	constructor () {
		super();

		this.data = []; 
	}

	async optimize () {
		await super.optimize();

		// Clone of data array, don't mutate it until optimization is done
		let temp = this.data.slice(0);
		let foundOffsets = {};

		for (let i = temp.length - 1; i >= 0; i--) {
			const offset = temp[i][0];

			// It's already been located, so this value is useless.
			if (foundOffsets[offset]) {
				temp.splice(i, 1);
				i++; // Add to i because we just made the length shorter, so we'll accidently skip over a value
			} else {
				foundOffsets[offset] = true;
			}
		}

		this.data = temp;
	}

	async storeOffset (offset, value) {
		await super.storeOffset(offset, value);

		this.data.push([offset, value]);
	}

	// Unique to this, because not all implementations would have an index
	async _getOffsetIndex (offset) {
		for (let i = 0, len = this.data.length; i < len; i++) {
			if (this.data[i][0] === offset) {
				return i;
			}
		}

		return -1;
	}

	async getOffset (offset) {
		await super.getOffset(offset);

		const index = await this._getOffsetIndex(offset);

		if (index === -1) {
			return null;
		} else {
			return this.data[index][1];
		}
	}
}

class ObjectEditStorage extends EditStorage {
	constructor () {
		super();

		this.data = {};
	}

	async storeOffset (offset, value) {
		await super.storeOffset(offset, value);

		this.data[offset] = value;
	}

	async getOffset (offset) {
		await super.getOffset(offset);

		if (!this.data.hasOwnProperty(offset)) {
			return null;
		} else {
			return this.data[offset];
		}
	}
}




module.exports = ArrayOffsetEditStorage;