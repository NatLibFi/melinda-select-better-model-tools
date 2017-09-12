/* eslint-disable no-console */

const utils = require('./utils');
const _ = require('lodash');

const SelectBetter = require('melinda-deduplication-common/select-better');

run().catch(error => {
  console.error(error);
});


async function run() {

  const recordSetData = await utils.readStdin();

  const recordSet = JSON.parse(recordSetData);

  const transformedSet = transformSet(recordSet);

  
  console.log(JSON.stringify(transformedSet));

}

function transformSet(recordSet) {
  
  return _.flatMap(recordSet, item => {
    const { preferred, other } = item;

    const features1 = SelectBetter.generateFeatures(preferred, SelectBetter.ExtractorPreset.Default);
    const features2 = SelectBetter.generateFeatures(other, SelectBetter.ExtractorPreset.Default);
    
    const vector1 = SelectBetter.generateFeatureVector(features1);
    const vector2 = SelectBetter.generateFeatureVector(features2);

    SelectBetter.normalizeFeatureVectors(vector1, vector2, SelectBetter.ExtractorPreset.Default);

    const firstIsBetter = {
      input: _.concat(vector1, vector2),
      output: [0],
      preferred: preferred,
      other: other
    };

    
    const secondIsBetter = {
      input: _.concat(vector2, vector1),
      output: [1],
      preferred: other,
      other: preferred
    };
    
    return [firstIsBetter, secondIsBetter];

    /*
    const label = Math.random() > 0.5 ? 0 : 1;
    const output = [label];
    // 0 means first is better, 1 means second is better
    const input = label === 0 ? _.concat(vector1, vector2) : _.concat(vector2, vector1);

    return { 
      input, output, 
      preferred: label === 0 ? preferred : other,
      other: label === 0 ? other : preferred
    };
    */
  });
}
