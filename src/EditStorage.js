/*
	This is very inefficient, but it's meant to be replaced later by a better more complex method of handling storing edits.
	The attempt here is to provide a complete 'api' (I can't think of a better term) that will behave the same even if we swap it out later

	The needs of this storage is:
		- Store the edits made to a file via their offsets into the file
		- Read quickly (since scrolling is done a lot in a hex editor, editing a hex file is done a bit less often at least in my personal use)
		- Write quickly (Less important than reading quickly, but it's still useful)
		- Async, even if the functions here aren't async so later when swapping out with code that might do more daring things that shouldn't be ran
			synchronously it will work just fine.
		- Be able to access a range of offsets, and get all the edits. Perhaps supply a buffer that it will edit with the needed replacements at offsets
		- Be memory efficient. It would be really really nice to have some form of compression to make storing large edits less of a pain.

	
	Ideas:
		- Store it as an array with many instances of [offset, value].
			It would be in order of precedence (just push newer changes to the end). One of them makes at an edit at 0x0010 to change it to FF
				A later one changes 0x0010 to FE, the later one takes precedence and the user never sees the display flicker between values
			In the background it will sometimes restructure the storage (the array of [offset, value]) to remove earlier edits that are superseded
			by later ones. This'll increase efficiency in reading. Especially, since if it's storing only single byte values then it's gonna have
			a ton of values.
			Unlikely to hit the max size of an array, even without optimization. A quick search says 
				`However, the maximum length of an array according to the ECMA-262 5th Edition specification is bound by an unsigned 32-bit integer 
				due to the ToUint32 abstract operation, so the longest possible array could have 2^32-1 = 4,294,967,295 = 4.29 billion elements`
				(stackoverflow)
			- Bonuses:
				- Fairly simple to implement.
				- If a program wanted to mess with it, it's easier to do things with
				- If you didn't optimize it, this could be used for a undo/redo storage. (Well it'd have to be extended)
			- Downsides:
				- Hard to compress (at least Im not coming up with anything good)
		- Same as above idea, but its stored as an array of (1) [offsetStart, offsetEnd, ...values] or (2) [offsetStart, offsetEnd, [values]] or might
			(3) [offsetStart, offsetEnd, value] (and just store value as a string of hex. number wouldn't work unless you used BigNum and split it 
			up into more)
			- Bonuses
				- (1,2,3) - Store more than one value per part of file. It's more likely that someone is editing multiple parts of a file in a nearby area
					rather than editing only one byte at a time (like the previous idea would do).
			- Downsides:
				- (3) - Have to make a function to grab things at a certain offset and extract that value from a number. Inefficient, but it shouldn't
					happen too often
				- (1,2,3) - Have to implement a function to find several instances which correspond to values in a range, grab them all together and 
					get the most important ones.
				- (1,2,3) - It becomes far more complex to manage optimization, as edits that intersect are likely to only intersect partially
		- Map/Object. Store an offset as a key (number/string) and get them as needed. Those that don't have a value just return undefined.
			This makes so there's no need for optimization like the first idea, well at least not in the same way. Sadly just like the first idea it doesn't
			have any special handling of a range of values which is going to be often used.
			I believe there's no limit on the keycount in an object. Not completely sure, and no clue about Map.
			- Bonuses
				- Fairly simple to implement
				- If a program wanted to mess with it, it's easier to do things with
				- No need for optimization (at least in the same way as idea #1), as when changing a key the last one is removed
			- Downsides
				- Hard to compress
		
			
*/

const EventEmitter = require('events');
const fs = require('fs');
const Log = require('./Log.js');


// The code below will likely make it quite harder to pack into a webbrowser, if that ever happens. Will deal with that when its actually needed


const fileValues = [ // [...lowercasenames, filename]
	['arrayoffset', 'arrayoffseteditstorage', './EditStorage/ArrayOffsetEditStorage'],
	['editstorage', './EditStorage/EditStorage.js'],
	['object', 'objecteditstorage', './EditStorage/ObjectEditStorage']
];

function find (name) {
	for (let i = 0; i < fileValues.length; i++) {
		for (let j = 0; j < fileValues[i].length - 1; j++) { // -1 because the last value in the arr is the filename
			if (name === fileValues[i][j]) {
				return fileValues[i][fileValues[i].length - 1]; // the last item, the filename
			}
		}
	}

	return null;
}

module.exports = (name='default') => {
	name = name.toLowerCase();

	let filename;

	if (name === 'default') {
		filename = 	find(process.env.HERX_EDITSTORAGE_DEFAULT);
	} else {
		filename = find(name);
	}

	if (typeof(filename) === 'string') {
		return require(filename);
	}

	throw new Error("EditStorage was given a name which was not a valid EditStorage module, name was: '" + name + "'");
};