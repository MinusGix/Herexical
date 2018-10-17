const View = require('./View.js');

class UIView extends View {
	constructor (file) {
		super(file);

		this.tags = new TagManager(this);
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
			let byte = this.fileWrapper._loaded._buffer[offset + i];

			// Doesn't exist
			if (byte === undefined) {
				break; // If it's undefined, then there should be nothing left, I don't believe buffers suddenly have completely empty space and then actual data ever
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

	getTagsInRange (rangeStart, rangeEnd) {
		return this.tags.filter(tag => 
			(rangeStart >= tag.offsetStart && rangeStart <= tag.offsetEnd) ||
			(rangeEnd <= tag.offsetEnd && rangeEnd >= tag.offsetStart)
		);
	}
}

module.exports = UIView;