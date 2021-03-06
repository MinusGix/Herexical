const fs = require('fs');

const Log = require('../Log.js');
const EditStorage = require('./EditStorage.js');

Log.timeStart('Loading-ArrayOffsetEditStorage');

// Idea #1 [offset, value][]
class ArrayOffsetEditStorage extends EditStorage {
	constructor (view) {
		super(view);

		this.data = []; 
	}

	async hasEdits () {
		return this.data.length > 0;
	}

	// 10-20ms on 500bytes
	async _save () {
		this.view.saving = true;

		const fd = this.view.fd;
		const buffer = Buffer.alloc(1);

		while (await this.hasEdits()) {
			let data = this.data[0];
			let offset = data[0];
			buffer[0] = await this.getOffset(offset, true);
			
			await new Promise((resolve, reject) => fs.write(fd, buffer, 0, 1, offset, (err) => {
				if (err) {
					return reject(err);
				}

				resolve();
			}));
		}

		this.view.saving = false;
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
	_getOffsetIndex (offset) {
		for (let i = this.data.length - 1; i >= 0; i--) {
			if (this.data[i][0] === offset) {
				return i;
			}
		}

		return -1;
	}

	async getOffset (offset, killEditStorage=false) {
		await super.getOffset(offset, killEditStorage);

		const index = this._getOffsetIndex(offset);
		

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

module.exports = ArrayOffsetEditStorage;

Log.timeEnd('Loading-ArrayOffsetEditStorage');
