/* eslint-disable no-console */
const utils = require('./utils');
const _ = require('lodash');

run();

async function run() {

  const recordSetData = await utils.readStdin();

  const recordSet = JSON.parse(recordSetData);

  const transformedSet = transformSet(recordSet);

  console.log(JSON.stringify(transformedSet));

}

function transformSet(recordSet) {
  
  return recordSet.map(item => {
    const preferred = item.pair.record1;
    const other = item.pair.record2;
    return { preferred, other };
  });
}
