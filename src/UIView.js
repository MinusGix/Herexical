const View = require('./View.js');
const Struct = require('./UIStructure.js');

class UIView extends View {
	constructor (file) {
		super(file);

		this.tags = new TagManager(this);

		// List of raw structures, not positioned anywhere
		this._structures = []; // Structure[]
		// List of Structures in the actual display
		this.displayedStructures = [];
	}

	addBaseStructure (struct) {
		this._structures.push(struct);
	}

	useStructure (index, offset) {
		let struct = this._structures[index];

		if (struct instanceof Struct.Structure) {
			struct = struct.clone();

			this.displayedStructures.push(struct);

			struct.offset = offset;

			struct.calculate(this._loadedData._buffer, 0);
		} else {
			throw new TypeError("index given was invalid");
		}
	}

	async getByte (offset) {
		if (!this.loaded) {
			// null -> there is no byte
			// undefined -> we can't grab the byte because we're not loaded
			return undefined;
		}

		let byte = this._loadedData._buffer[offset];

		if (byte === undefined) {
			// There is no byte
			return null;
		}

		return byte;
	}

	async getLine (offset, byteCount, includeString=false) {
		if (!this.loaded) {
			// Perhaps should load it?
			return null; // Needs to be loaded first!
		}

		let ret = {
			offset: this.getFileOffset(offset),
			bytes: [],
			text: [],
		};

		for (let i = 0; i < byteCount; i++) {
			let byte = await this.getByte(offset + i);

			if (byte === undefined || byte === null) {
				break;
			}
			
			ret.bytes.push(byte);

			if (includeString) {
				ret.text.push(this._getValidCharacter(byte));
			}
		}

		return ret;
	}

	_getValidCharacter (byte) {
		if (this._isValidDisplayableChar(byte)) {
			return String.fromCharCode(byte);
		} else {
			// Null represents a character that can't be shown as a string, users of this can decide what its shown as
			return null;
		}
	}

	_isValidDisplayableChar (byte) {
		return (
			byte >= 32 && // space
			byte <= 127 // weird .. char
		) ||
		(
			byte >= 161 && // upside down exclamation mark
			byte <= 255 // y with dots above it
		)
	}
}

class TagManager {
	constructor (parent) {
		this.view = parent;

		this.tags = [];
	}

	// offsetStart: The position of the start of the tag
	// offsetEnd: The position of the end of the tag
	// name: the name for displaying (though, it doesn't have to be used as that, or even used at all)
	// data: any sort of data the program wants to associate with the tag
	addTag (offsetStart, offsetEnd, name, data) {
		this.tags.push({offsetStart, offsetEnd, name, data});
	}

	// item: some entry in the tags array
	removeTag (item) {
		return this.removeTagByIndex(this.tags.indexOf(item));
	}

	removeTagByIndex (index=-1) {
		if (index === -1) {
			return false;
		}

		this.tags.splice(index, 1);

		return true;
	}

	getTagByIndex (index=-1) {
		return this.tags[index] || null;
	}

	getTagsByName (name) {
		this.tags.filter(tag => tag.name === name);
	}

	getTagOffsetStart (item) {
		return typeof(item.offsetStart) === 'function' ? item.offsetStart(this, item) : item.offsetStart;
	}

	getTagOffsetEnd (item) {
		return typeof(item.offsetEnd) === 'function' ? item.offsetEnd(this, item) : item.offsetEnd;
	}

	getTagOffsetStartByIndex (index) {
		return this.getTagOffsetStart(this.tags[index]);
	}

	getTagOffsetEndByIndex (index) {
		return this.getTagOffsetEnd(this.tags[index]);
	}

	getTagsInRange (rangeStart, rangeEnd) {
		return this.tags.filter(tag => 
			(rangeStart >= this.getTagOffsetStart(tag) && rangeStart <= this.getTagOffsetEnd(tag)) ||
			(rangeEnd <= this.getTagOffsetEnd(tag) && rangeEnd >= this.getTagOffsetStart(tag))
		);
	}
}

module.exports = UIView;