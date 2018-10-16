const View = require('./View.js');

class UIView extends View {
	constructor (file) {
		super(file);
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

module.exports = UIView;