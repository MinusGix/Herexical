function Log (...args) {
	if (process.env.HERX_SHOULD_LOG) {
		const logTo = process.env.HERX_LOG_TO;

		if (logTo === 'console' || logTo === 'console&file') {
			console.log(...args);
		}

		if (logTo === 'file' || logTo === 'console&file') {
			// TODO: log to file in HERX_LOG_FILE here
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
		Log('[TIMING]', name, '-', Date.now() - Times[name], '-', ...args);
		delete Times[name];
	}
}

module.exports = {
	raw: Log,
	debug: logDebug,
	error: logError,
	time: logTime,
	timeStart: timeStart,
	timeEnd: timeEnd
};