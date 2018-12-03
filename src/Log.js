const Config = require('../config.js');

const fs = require('fs');
const Err = require('./Error.js');
const util = require('util');

let indentLevel = 0;

let indentLevels = [];

let logFileName;
let logFileFD;

function constructLogFile () {
	logFileName = Config.LOG_FILE.replace(/\{date\}/g, Date.now().toString());

	// Rather than use a promise here, or the callback on async version, we want to make sure this is created before we start logging
	logFileFD = fs.openSync(logFileName, 'a');
}

function writeLogFile (...args) {
	if (!logFileName) {
		constructLogFile();
	}

	args.push('\n');

	return new Promise((resolve, reject) => fs.write(logFileFD, args.map(arg => util.format(arg)).join(' '), (err) => {
		if (err) {
			return reject(err);
		}

		resolve();
	}));
}

function Log (...args) {
	if (Config.SHOULD_LOG) {
		const logTo = Config.LOG_TO;

		if (logTo === 'console' || logTo === 'console&file') {
			console.log(getIndent(), ...args);
		}

		if (logTo === 'file' || logTo === 'console&file') {
			writeLogFile(getIndent(), ...args);
		}
	}
}

function logMemoryUsage () {
	const used = process.memoryUsage();
	
	Log('[MEM]');
	increaseIndent();

	for (let key in used) {
		Log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
	}
	
	decreaseIndent();
	Log('[/MEM]');
}

function logDebug (...args) {
	if (Config.DEBUG_LOGGING) {
		Log('[DEBUG]', ...args);
	}
}

function logInfo (...args) {
	if (Config.INFO_LOGGING) {
		Log('[INFO]', ...args);
	}
}

function logError (...args) {
	if (Config.ERROR_LOGGING) {
		Log('[ERROR]', ...args);
	}
}

function logWarn (...args) {
	if (Config.WARN_LOGGING) {
		Log('[WARN]', ...args);
	}
}

function logTrace (name, ...args) {
	if (Config.TRACE_LOGGING) {
		Log('[TRACE]', (new Error(name)).stack, ...args);
	}
}

let Times = {};

function logTime (name, ...args) {
	if (Config.TIME_LOGGING) {
		if (Times.hasOwnProperty(name)) {
			timeEnd(name);
		} else {
			timeStart(name);
		}
	}
}

function timeStart (name) {
	if (Config.TIME_LOGGING) {
		Times[name] = Date.now();
		Log('[TIMING]', name);
		increaseIndent();
	}
}

function timeEnd (name, ...args) {
	if (Config.TIME_LOGGING) {
		decreaseIndent();
		Log('[/TIMING]', name, '-', Date.now() - Times[name], 'ms -', ...args);
		delete Times[name];
	}
}

function _getIndent (level=0) {
	return '\t'.repeat(level);
}

function getIndent () {
	if (indentLevel in indentLevels) {
		return indentLevels[indentLevel];
	}

	Log.info('Inefficient call to get indent with level', indentLevel);
	return _getIndent(indentLevel);
}

// Essentially preload them. I imagine array access is faster than repeated .repeat calls when there's lots of logging
// This is probably (certainly) a premature optimization
function populateIndentLevels () {
	indentLevels = [];

	for (let i = 0; i <= Config.MAX_INDENT_LEVEL; i++) {
		indentLevels.push(_getIndent(i));
	}
}

function increaseIndent (amount=1) {
	indentLevel++;
	checkIndent();
}

function decreaseIndent (amount=1) {
	indentLevel--;
	checkIndent();
}

function setIndent (value=0) {
	indentLevel = indentLevel;
	checkIndent();
}

// Check if the input is out of bounds
function checkIndent () {
	if (indentLevel < 0) {
		indentLevel = 0;
	}

	if (indentLevel > Config.MAX_INDENT_LEVEL) {
		indentLevel = Config.MAX_INDENT_LEVEL;
	}
}

populateIndentLevels();

module.exports = {
	raw: Log,
	debug: logDebug,
	info: logInfo,
	error: logError,
	warn: logWarn,
	trace: logTrace,
	time: logTime,
	timeStart: timeStart,
	timeEnd: timeEnd,

	memoryUsage: logMemoryUsage,

	increaseIndent,
	decreaseIndent,
	setIndent,
};