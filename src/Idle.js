function Idle (retrieveFunc) {
	let value;

	return () => {
		// Perhaps should have another boolean which keeps track of if it has been retrieved? Less error prone, but this should be fine.
		if (value === undefined) {
			value = retrieveFunc();
		}

		return value;
	}
}

function AsyncIdle (retrieveFunc) {
	let value;

	return async () => {
		if (value === undefined) {
			value = await retrieveFunc();
		}

		return value;
	}
}

module.exports = {
	Idle,
	AsyncIdle,
};