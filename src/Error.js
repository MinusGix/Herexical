function FatalError (err, ...text) {
	console.log(...text, err);
	process.exit(1);
}

function CurryError (errorFunc, ...text) {
	return (err) => errorFunc(err, ...text);
}

function FatalCurry (...text) {
	return CurryError(FatalError, ...text);
}

module.exports = {
	FatalError,
	CurryError,
	FatalCurry,
};