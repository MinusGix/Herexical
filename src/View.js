const FileWrap = require('./FileWrap.js');
const BufferWrap = require('./BufferWrap.js');
const Err = require('./Error.js');

class View {
	constructor (file) {
		this.fileWrapper = new FileWrap(file);

		this._viewSize = 64; // How many bytes to load whenever its told to load
		this._position = 0; // the current position in the file by bytes

		this.loaded = false;
	}

	get viewSize () {
		return this._viewSize;
	}

	set viewSize (newViewSize) {
		this._viewSize = newViewSize;
		this.loaded = false;
	}

	get position () {
		return this._position;
	}

	set position (newPosition) {
		this._position = newPosition;
		this.loaded = false;
	}

	async init () {
		await this.fileWrapper.init();
	}

	async loadView () {
		if (this.loaded) {
			return false; // the view has already been loaded, no need to reload it
		}

		await this.fileWrapper.loadData(this.position, this.viewSize);
		this.loaded = true;
		
		return true;
	}
}

module.exports = View;