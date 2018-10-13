const FileWrap = require('./FileWrap.js');
const BufferWrap = require('./BufferWrap.js');
const Err = require('./Error.js');
const EventEmitter = require('events');
const Log = require('./Log.js');

Log.timeStart('Loading-View');

class View extends EventEmitter {
	constructor (file) {
		super();

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

		this.emit('unloaded');
	}

	get position () {
		return this._position;
	}

	set position (newPosition) {
		this._position = newPosition;
		this.loaded = false;

		this.emit('unloaded');
	}

	async init () {
		Log.timeStart('View-Init');
		this.emit('init:start');

		await this.fileWrapper.init();

		this.fileWrapper.on('edited', () => {
			this.loaded = false;

			this.emit('unloaded');
		});

		this.emit('init:done');
		Log.timeEnd('View-Init');
	}

	async loadView (force=false) {
		if (this.loaded && !force) {
			return false; // the view has already been loaded, no need to reload it
		}

		Log.timeStart('View-loadView');
		this.emit('loadView:start');

		await this.fileWrapper.loadData(this.position, this.viewSize);
		this.loaded = true;
		
		this.emit('loadView:done');
		Log.timeEnd('View-loadView');

		return true;
	}
}

module.exports = View;

Log.timeEnd('Loading-View');