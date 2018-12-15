const fs = require('fs');
const EventEmitter = require('events');

const Log = require('../Log.js');


Log.timeStart('Loading-EditStorage');

// A class empty of actual storage functionality, a base class.
// Most if not all of the methods should return a promise (or be async) so that implementations that do stuff like write to file or use a db
//	can do that without need of modifying code
class EditStorage extends EventEmitter {
	constructor (view) {
		super();

		this.view = view;

		this.settings = {};

		// If a function to store a range of offsets is given something (offsetStart='019A2', offsetEnd='01000') then it's going back
		// if it is lenient, then it will simply swap those two values, otherwise it won't
		this.settings.lenientOffsetRangeStorage = false;
	}

	async save (optimize=true) {
		if (this.view.saving) {
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
		this.view.saving = true;

		let sizeLeft = Number(await this.view.getSize());
		let currentPieceSize = 0;
		let pos = 0;
		// Preload these so we aren't doing the access several times
		const fd = this.view.fd;
		const maxBufferSize = Number(this.view.constructor.MAX_BUFFER_SIZE);

		while (sizeLeft > 0 && (await this.hasEdits())) {
			if (sizeLeft > maxBufferSize) {
				currentPieceSize = maxBufferSize;
			} else { // lower than, so this is also the last write we need to do
				currentPieceSize = sizeLeft;
			}

			let buf = await this.view._loadData(pos, currentPieceSize, true);
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

		this.view.saving = false;
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

module.exports = EditStorage;

Log.timeEnd('Loading-EditStorage');