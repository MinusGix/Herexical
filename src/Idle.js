function Idle (retrieveFunc) {
	let value;
	let func = () => {
		// Perhaps should have another boolean which keeps track of if it has been retrieved? Less error prone, but this should be fine.
		if (value === undefined) {
			value = retrieveFunc();
		}

		return value;
	};
	func.revoke = () => {
		value = undefined;
	};

	return func;
}

function AsyncIdle (retrieveFunc) {
	let value;
	let func = async () => {
		if (value === undefined) {
			value = await retrieveFunc();
		}

		return value;
	};
	func.revoke = () => {
		value = undefined;
	};

	return func;
}

module.exports = {
	Idle,
	AsyncIdle,
};