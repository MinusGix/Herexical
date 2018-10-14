const fs = require('fs');

const Log = require('../Log.js');
const EditStorage = require('./EditStorage.js');

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

module.exports = ArrayOffsetEditStorage;

Log.timeEnd('Loading-ArrayOffsetEditStorage');
