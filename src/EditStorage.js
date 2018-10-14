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
const fs = require('fs');
const Log = require('./Log.js');

Log.timeStart('Loading-EditStorage-all');
Log.timeStart('Loading-EditStorage');

// A class empty of actual storage functionality, a base class.
// Most if not all of the methods should return a promise (or be async) so that implementations that do stuff like write to file or use a db
//	can do that without need of modifying code
class EditStorage extends EventEmitter {
	constructor (fileWrapper) {
		super();

		this.fileWrapper = fileWrapper;

		this.settings = {};

		// If a function to store a range of offsets is given something (offsetStart='019A2', offsetEnd='01000') then it's going back
		// if it is lenient, then it will simply swap those two values, otherwise it won't
		this.settings.lenientOffsetRangeStorage = false;
	}

	async save (optimize=true) {
		if (this.fileWrapper.saving) {
			throw new Error("Can't save while already saving.");
		}

		Log.timeStart('EditStorage-save');

		if (optimize) {
			// Optimize it so that the saving can go faster. In some cases this might actually make it go
			await this.optimize();
		}

		await this._save();

		Log.timeEnd('EditStorage-save', this.constructor.name);
	}

	// Actual save function
	// 500 - 800ms on write in first 1mb of _TestLarge.bin
	async _save () {
		this.fileWrapper.saving = true;

		let sizeLeft = Number(await this.fileWrapper.getSize());
		let currentPieceSize = 0;
		let pos = 0;
		// Preload these so we aren't doing the access several times
		const fd = this.fileWrapper.fd;
		const maxBufferSize = Number(this.fileWrapper.constructor.MAX_BUFFER_SIZE);

		while (sizeLeft > 0 && (await this.hasEdits())) {
			if (sizeLeft > maxBufferSize) {
				currentPieceSize = maxBufferSize;
			} else { // lower than, so this is also the last write we need to do
				currentPieceSize = sizeLeft;
			}

			let buf = await this.fileWrapper._loadData(pos, currentPieceSize, true);
			pos += currentPieceSize;
			
			Log.timeStart('_save fs.write');
			await new Promise((resolve, reject) => fs.write(fd, buf, (err) => {
				if (err) {
					reject(err);
				}

				resolve();
			}));
			Log.timeEnd('_save fs.write');

			sizeLeft -= currentPieceSize;
		}
	}

	async hasEdits () {
		return false;
	}

	// offsetStart - the start of the buf into the file buf[0] = file[offsetStart]
	// buf - the buffer slice of the file
	// killEditStorage - If it should remove values that are used. Used when saving, because if its saved then it doesn't need them anymore.
	async writeBuffer (offsetStart, buf, killEditStorage=false) {
		Log.timeStart('writeBuffer');
		this.emit('writeBuffer', offsetStart, buf);

		if (!(await this.hasEdits())) {
			Log.timeEnd('writeBuffer');

			return buf;
		}
		
		const values = await this.getOffsetRange(offsetStart, offsetStart + buf.length, killEditStorage);

		for (let key in values) {
			if (values[key] !== null && values[key] !== undefined) {
				buf[key] = values[key];
			}
		}

		Log.timeEnd('writeBuffer');
		return buf;
	}

	async optimize () {
		this.emit('optimize');
	}

	async storeOffset (offset, value) {
		this.emit('storeOffset', offset, value);
	}

	async storeOffsetRange (offsetStart, offsetEnd, values) {
		Log.timeStart('storeOffsetRange');
		this.emit('storeOffsetRange', offsetStart, offsetEnd, value);

		if (offsetStart > offsetEnd) {
			if (this.settings.lenientOffsetRangeStorage) {
				throw new RangeError("offsetStart was earlier than offsetEnd, not allowed.")
			} else {
				// Be lenient and just swap them around
				return await this.storeOffsetRange(offsetEnd, offsetStart, values);
			}
		}

		// TODO: perhaps change this to valuesIsObj like _storeOffsetRange
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

			Log.timeEnd('storeOffsetRange');
			return await this.storeOffset(offsetStart, value);
		}

		Log.timeEnd('storeOffsetRange');
		return await this._storeOffsetRange(offsetStart, offsetEnd, values);
	}

	// This is storeOffsetRange without any checks and is the actual code to store the offset range
	// An instance that stores each offset individually could probably leave this as default 
	// But an instance that is more efficient and stores offset ranges itself would want to modify this rather than storeOffsetRange
	async _storeOffsetRange (offsetStart, offsetEnd, values) {
		// Adds each and every offset from offsetStart and offsetEnd.

		Log.timeStart('_storeOffsetRange');

		const valuesIsObj = typeof(values) === 'object' && values !== null;

		for (let currentOffset = offsetStart; currentOffset <= offsetEnd; currentOffset += 1) {
			if (valuesIsObj) {
				if (currentOffset in values) {
					await this.storeOffset(n, values[currentOffset]);
				} else {
					Log.trace('[WARN] ' + toString(currentOffset) + ' was not in the values array/object.');
				}
			} else {
				await this.storeOffset(n, values);
			}
		}

		Log.timeEnd('_storeOffsetRange')
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

	async getOffset (offset, killEditStorage=false) {
		this.emit('getOffset', offset, killEditStorage);
	}

	async getOffsetRange (offsetStart, offsetEnd, killEditStorage=false) {
		Log.timeStart('getOffsetRange');
		this.emit('getOffsetRange', offsetStart, offsetEnd, killEditStorage);
				
		if (offsetStart > offsetEnd) {
			if (this.settings.lenientOffsetRangeStorage) {
				Log.timeEnd('getOffsetRange', 'error', offsetStart, offsetEnd, killEditStorage);

				throw new RangeError("offsetStart was earlier than offsetEnd, not allowed.")
			} else {
				Log.timeEnd('getOffsetRange', 'swapping', offsetStart, offsetEnd, killEditStorage);

				// Be lenient and just swap them around
				return await this.getOffsetRange(offsetEnd, offsetStart, killEditStorage);
			}
		}

		// This means that the start is the end. So there's only one value. A program that uses this might just call this whenever an edit is made
		if (offsetStart === offsetEnd) {
			Log.timeEnd('getOffsetRange', 'same-start-end', offsetStart, offsetEnd, killEditStorage);
			// Wrap it in an array because this function normally returns an array
			return { [offsetStart]: await this.getOffset(offsetStart, killEditStorage) };
		}

		const val = await this._getOffsetRange(offsetStart, offsetEnd, killEditStorage);

		Log.timeEnd('getOffsetRange', offsetStart, offsetEnd, killEditStorage);

		return val;
	}

	// This is getOffsetRange without any checks and is the actual code to grab the offset range
	// Just look at _storeOffsetRange comments
	// For instances that don't store each offset separately this will almost certainly have to be modified to be more efficient
	async _getOffsetRange (offsetStart, offsetEnd, killEditStorage=false) {
		Log.timeStart('_getOffsetRange');

		let values = {};

		for (let currentOffset = offsetStart; currentOffset <= offsetEnd; currentOffset += 1) {
			let result = await this.getOffset(currentOffset, killEditStorage);
			
			if (result !== null) {
				values[currentOffset] = result;
			}
		}

		Log.timeEnd('_getOffsetRange', offsetStart, offsetEnd, killEditStorage);

		return values;
	}

	async getOffsets (offsetList, killEditStorage=false) {
		Log.timeStart('getOffsets');
		this.emit('getOffset', offsetList, killEditStorage);

		let values = [];

		for (let i = 0; i < offsetList.length; i++) {
			values.push(await this.getOffset(offsetList[i], killEditStorage));
		}

		Log.timeEnd('getOffsets', offsetList.length, killEditStorage);

		return values;
	}
}

Log.timeEnd('Loading-EditStorage');

Log.timeStart('Loading-ArrayOffsetEditStorage');

// Idea #1 [offset, value][]
class ArrayOffsetEditStorage extends EditStorage {
	constructor (fileWrapper) {
		super(fileWrapper);

		this.data = []; 
	}

	async hasEdits () {
		return this.data.length > 0;
	}

	// 10-20ms on 500bytes
	async _save () {
		this.fileWrapper.saving = true;

		const fd = this.fileWrapper.fd;
		const buffer = Buffer.alloc(1);

		while (await this.hasEdits()) {
			buffer[0] = await this.getOffset(this.data[0][0], true);
			
			await new Promise((resolve, reject) => fs.write(fd, buffer, err => {
				if (err) {
					return reject(err);
				}

				resolve();
			}));
		}
	}

	async optimize () {
		Log.timeStart('ArrayOffsetEditStorage-optimize');

		await super.optimize();

		// Clone of data array, don't mutate it until optimization is done
		let temp = this.data.slice(0);
		let foundOffsets = {};

		Log.info('Data size before:', temp.length);

		for (let i = temp.length - 1; i >= 0; i--) {
			if (!temp[i]) {
				break;
			}

			let offset = temp[i][0];

			if (foundOffsets[offset]) {
				temp.splice(i, 1);
			} else {
				foundOffsets[offset] = true;
			}
		}
		foundOffsets = null;

		Log.info('Data size after:', temp.length);
		
		this.data = temp;

		Log.timeEnd('ArrayOffsetEditStorage-optimize');
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

	async getOffset (offset, killEditStorage=false) {
		await super.getOffset(offset, killEditStorage);

		const index = await this._getOffsetIndex(offset);
		

		if (index === -1) {
			return null;
		} else {
			let value = this.data[index][1];
			
			if (killEditStorage) {
				this.data.splice(index, 1);
			}

			return value;
		}
	}
}

Log.timeEnd('Loading-ArrayOffsetEditStorage');

Log.timeStart('Loading-ObjectEditStorage');

class ObjectEditStorage extends EditStorage {
	constructor (fileWrapper) {
		super(fileWrapper);

		this.data = {};
	}

	async hasEdits () {
		for (let key in this.data) {
			if (this.data.hasOwnProperty(key)) {
				return true;
			}
		}

		return false;
	}

	async storeOffset (offset, value) {
		await super.storeOffset(offset, value);

		this.data[offset] = value;
	}

	async getOffset (offset, killEditStorage=false) {
		await super.getOffset(offset, killEditStorage);

		if (!this.data.hasOwnProperty(offset)) {
			return null;
		} else {
			let value = this.data[offset];

			if (killEditStorage) {
				delete this.data[offset];
			}

			return value;
		}
	}
}

Log.timeEnd('Loading-ObjectEditStorage');



module.exports = ArrayOffsetEditStorage;

Log.timeEnd('Loading-EditStorage-all');