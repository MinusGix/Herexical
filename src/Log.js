let indentLevel = 0;

let indentLevels = [];

function Log (...args) {
	if (process.env.HERX_SHOULD_LOG) {
		const logTo = process.env.HERX_LOG_TO;

		if (logTo === 'console' || logTo === 'console&file') {
			console.log(getIndent(), ...args);
		}

		if (logTo === 'file' || logTo === 'console&file') {
			// TODO: log to file in HERX_LOG_FILE here
			// Just doing fs.write a lot would be slow, wouldn't it?
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
	}
}

function timeEnd (name, ...args) {
	if (process.env.HERX_TIME_LOGGING) {
		Log('[TIMING]', name, '-', Date.now() - Times[name], 'ms -', ...args);
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
	time: logTime,
	timeStart: timeStart,
	timeEnd: timeEnd
};