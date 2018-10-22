/*
	Simply a file to test the code quickly. Not pushed to git.
*/

const Herx = require('./index.js');
const fs = require('fs');

function splitString(str, chunkSize = 2) {
	// modified from https://stackoverflow.com/a/6259536
	let chunks = [];

	for (let i = 0, charsLength = str.length; i < charsLength; i += chunkSize) {
		chunks.push(str.substring(i, i + chunkSize));
	}

	return chunks;
}

async function writeData(view, force = false) {
	let fileSize = await view.fileWrapper.getSize();
	await view.loadView(force);

	Herx.Log.info('File Size (Bytes):', fileSize, '\n\tis correct:', fileSize === 1024n);

	let displayData = view.fileWrapper._loaded._buffer.toString('hex');
	Herx.Log.info('Read Data:    ', displayData);
	Herx.Log.info('Nicer Data:   ', splitString(displayData, 2).join(' ')); // make this display as split every two chars ff ff ff 00 etc
	Herx.Log.info('Nibble Count: ', displayData.length);
	Herx.Log.info('Buffer Length:', view.fileWrapper._loaded._buffer.length);
}

(async () => {
	Herx.Log.timeStart('Test-Program');

	Herx.Log.memoryUsage();

	const Files = {
		small: "./temp/_TestSmall.bin",
		large: "./temp/_TestLarge.bin",
	};
	const curFile = Files.small;
	const isEditing = false; // if it should edit the file and save it
	const testPosition = false; // If it should change the position and log it
	const testIdleSize = false;
	const testSearch = false;
	const testHexView = false;
	const testTags = false;
	const testStruct = false;
	const testBitFlagStruct = false;
	const testStructStruct = false;

	let view = new Herx.UIView(curFile);

	await view.init();

	//await writeData(view);

	if (isEditing) {
		if (curFile === Files.small) {
			Herx.Log.info('Writing small file data');
			for (let i = 0; i < 0xFF; i++) {
				await view.fileWrapper.edit(i, i);
			}
		} else if (curFile === Files.large) {
			Herx.Log.info('Writing large file data');

			for (let i = 0; i < 0xFF; i++) {
				await view.fileWrapper.edit(i, i);
			}
		}
	}

	if (testPosition) {
		await writeData(view);

		view.position++;

		await writeData(view);

		view.position--;

		await writeData(view);

		view.position = 1022;

		await writeData(view);
	}

	//console.log(await view.getDataOnOffset(0));

	if (isEditing) {
		await view.fileWrapper.save();
	}

	if (testIdleSize) {
		Herx.Log.debug(await view.fileWrapper.getSize());
		Herx.Log.debug(await view.fileWrapper.getSize());
	}

	if (testSearch) {
		try {
			console.log(await view.fileWrapper.searchHexArray([0xAA, 0xBB]));
			console.log(await view.fileWrapper.searchString("test", false))
		} catch (err) {
			console.log(err);
		}
	}

	await writeData(view);

	if (testHexView) {
		const offsetIntoFile = 0;
		const byteCount = 0xA;

		view.viewSize = 128;
		await view.loadView();

		const offsetSize = 6;

		let header = '';
		for (let i = 0; i < byteCount; i++) {
			let val = i.toString(16);

			if (val.length === 1) {
				val = '0' + val;
			}

			header += val;

			if (i !== byteCount - 1) {
				header += ' ';
			}
		}

		let data1 = await view.getLine(offsetIntoFile, byteCount, true);

		const offset1 = data1.offset.toString(16);

		console.log(' '.repeat(offsetSize) + '| ' + header);
		console.log('0'.repeat(offsetSize - offset1.length) + offset1 + ': ' + data1.bytes.map(byte => {
			let val = byte.toString(16);

			if (val.length === 1) {
				val = '0' + val;
			}

			return val;
		}).join(' ') + ' | ' + data1.text.map(txt => txt === null ? '.' : txt).join(''));


		let data2 = await view.getLine(offsetIntoFile + byteCount, byteCount, true);
		const offset2 = data2.offset.toString(16);
		console.log('0'.repeat(offsetSize - offset2.length) + offset2 + ': ' + data2.bytes.map(byte => {
			let val = byte.toString(16);

			if (val.length === 1) {
				val = '0' + val;
			}

			return val;
		}).join(' ')  + ' | ' + data2.text.map(txt => txt === null ? '.' : txt).join(''));

	}

	if (testTags) {
		view.tags.addTag(10, 30, 'test');
		console.log('0,5', view.tags.getTagsInRange(0, 5));
		console.log('0,10', view.tags.getTagsInRange(0, 10));
		console.log('10,10', view.tags.getTagsInRange(10, 10));
		console.log('10,30', view.tags.getTagsInRange(10, 30));
		console.log('15,25', view.tags.getTagsInRange(15, 25));
		console.log('25,45', view.tags.getTagsInRange(25, 45));
		console.log('30,35', view.tags.getTagsInRange(30, 35));
		console.log('35,50', view.tags.getTagsInRange(35, 50));
	}

	if (testStruct) {
		await view.loadView();

		let struct = new Herx.Struct.Structure();
		struct.name = 'Person';

		let ageItem = new Herx.Struct.IntStructureItem(0, 8);
		ageItem.name = 'Age';
		let nameSize = new Herx.Struct.IntStructureItem(1, 8);
		nameSize.name = 'nameSize';
		let name = new Herx.Struct.StringStructureItem(2, 'nameSize');
		name.name = 'name';
		let alive = new Herx.Struct.BoolStructureItem('2 + nameSize', true)
		alive.name = 'alive';

		view.addBaseStructure(struct);

		struct.structureItems.push(ageItem);
		struct.structureItems.push(nameSize);
		struct.structureItems.push(name);
		struct.structureItems.push(alive);

		view.useStructure(0, 0);

		console.log(view.displayedStructures[0].structureItems.map(item => [item.name, item.value]));
	}

	if (testBitFlagStruct) {
		await view.loadView();

		let struct = new Herx.Struct.Structure();
		struct.name = 'bitflag';

		let bitFlag = new Herx.Struct.BitFlagStructureItem(0, {
			first: 0,
			second: 1,
			third: 2,
			fourth: 3,
			fifth: [4, 5, 6],
			sixth: 5,
			seventh: 6,
			eighth: 7,
			ninth: 8,
			tenth: 9,
			eleventh: 10,
			twelfth: 11,
			thirteenth: 12,
			fourteenth: 13,
			fifteenth: [14, 15],
		}, 2);
		bitFlag.name = 'BitFlag';

		struct.structureItems.push(bitFlag);

		view.addBaseStructure(struct);
		view.useStructure(1, 0);

		console.log(view.displayedStructures[1].structureItems.map(item => [item.name, item.value]));
	}

	if (testStructStruct) {
		view.viewSize = 256;
		await view.loadView();

		let struct = new Herx.Struct.Structure();
		struct.name = 'group';

		let header = new Herx.Struct.StringStructureItem(0, 3);
		header.name = 'header';
		let version = new Herx.Struct.IntStructureItem(3, 8);
		version.name = 'version';
		let groupNameSize = new Herx.Struct.IntStructureItem(4, 8);
		groupNameSize.name = 'GroupNameSize';
		let groupName = new Herx.Struct.StringStructureItem(5, 'GroupNameSize');
		groupName.name = 'GroupName';
		let peopleStructCount = new Herx.Struct.IntStructureItem('6 + GroupNameSize', 16);
		peopleStructCount.name = 'PeopleStructCount';

		let peopleStruct = new Herx.Struct.Structure();
		peopleStruct.name = 'people';

		let peopleItem = new Herx.Struct.StructureStructureItem(peopleStruct, 'PeopleStructCount');
		peopleItem.name = 'people'

		view.addBaseStructure(struct);

		struct.structureItems.push(
			header,
			version,
			groupNameSize,
			groupName,
			peopleStructCount,
			peopleItem
		);

		view.useStructure(0, 0);

		console.log(view.displayedStructures[0].toJSON());
		console.log(view.displayedStructures[0].structureItems.map(item => {
			let ret = [item.name, item.value]
		}));
	}

	//let iter = view.file._loaded.values();
	//console.log('          ', ...iter);

	/* Baseline without actually initializing a view, just requiring.
		rss 30.26 MB
		heapTotal 9.23 MB
		heapUsed 3.94 MB
		external 0.01 MB
	*/

	Herx.Log.memoryUsage();

	Herx.Log.timeEnd('Test-Program');
})();