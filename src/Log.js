const fs = require('fs');
const Err = require('./Error.js');
const util = require('util');

let indentLevel = 0;

let indentLevels = [];

let logFileName;
let logFileFD;

function constructLogFile () {
	// Uses a process.env
	logFileName = process.env.HERX_LOG_FILE.replace(/\{date\}/g, Date.now().toString());

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
	if (process.env.HERX_SHOULD_LOG) {
		const logTo = process.env.HERX_LOG_TO;

		if (logTo === 'console' || logTo === 'console&file') {
			console.log(getIndent(), ...args);
		}

		if (logTo === 'file' || logTo === 'console&file') {
			writeLogFile(getIndent(), ...args);
		}
	}
}

function logDebug (...args) {
	if (process.env.HERX_DEBUG_LOGGING) {
		Log('[DEBUG]', ...args);
	}
}

function logInfo (...args) {
	if (process.env.HERX_INFO_LOGGING) {
		Log('[INFO]', ...args);
	}
}

function logError (...args) {
	if (process.env.HERX_ERROR_LOGGING) {
		Log('[ERROR]', ...args);
	}
}

function logWarn (...args) {
	if (process.env.HERX_WARN_LOGGING) {
		Log('[WARN]', ...args);
	}
}

function logTrace (name, ...args) {
	if (process.env.HERX_TRACE_LOGGING) {
		Log('[TRACE]', (new Error(name)).stack, ...args);
	}
}

let Times = {};

function logTime (name, ...args) {
	if (process.env.HERX_TIME_LOGGING) {
		if (Times.hasOwnProperty(name)) {
			timeEnd(name);
		} else {
			timeStart(name);
		}
	}
}

function timeStart (name) {
	if (process.env.HERX_TIME_LOGGING) {
		Times[name] = Date.now();
		Log('[TIMING]', name);
		increaseIndent();
	}
}

function timeEnd (name, ...args) {
	if (process.env.HERX_TIME_LOGGING) {
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
// This is probably a premature optimization
function populateIndentLevels () {
	indentLevels = [];

	for (let i = 0; i <= process.env.HERX_MAX_INDENT_LEVEL; i++) {
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

	if (indentLevel > process.env.HERX_MAX_INDENT_LEVEL) {
		indentLevel = process.env.HERX_MAX_INDENT_LEVEL;
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

	increaseIndent,
	decreaseIndent,
	setIndent,
};