const fs = require('fs');

const Log = require('../Log.js');
const EditStorage = require('./EditStorage.js');

Log.timeStart('Loading-ObjectEditStorage');

class ObjectEditStorage extends EditStorage {
	constructor (view) {
		super(view);

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

module.exports = ObjectEditStorage;

Log.timeEnd('Loading-ObjectEditStorage');
