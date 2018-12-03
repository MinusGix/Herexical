let exportObject = {}

// If it should log at all, all the other logging depends on this.
exportObject.SHOULD_LOG = true;
// Whether to log Debug messages
exportObject.DEBUG_LOGGING = true;
// Whether to log simple info messages
exportObject.INFO_LOGGING = true;
// Whether to log Error messages
exportObject.ERROR_LOGGING = true;
// Whether to log Warning messages
exportObject.WARN_LOGGING = true;
// Whether to log err trace messages (Note: this doesn't stop normal traces, this is related to a function that logs the current trace)
exportObject.TRACE_LOGGING = true;
// Subset of info, requires INFO_LOGGING to be true as well. This logs the time it takes for things to complete
exportObject.TIME_LOGGING = true;
// Where to log to, possible values: "console" | "file" | "console&file"
exportObject.LOG_TO = "console&file";
exportObject.LOG_FILE = "logs/log-{date}.txt";

// The max input level, anymore than this and it might be hard to read!
exportObject.MAX_INDENT_LEVEL = 6;

//== MODULE SETTINGS

// The EditStorage module to load by default, looked up in a listing.
exportObject.EDITSTORAGE_DEFAULT = "arrayoffset";

module.exports = exportObject;