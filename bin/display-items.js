const _ = require('lodash');
const fs = require('fs');
const items = JSON.parse(fs.readFileSync('/tmp/select-better-guesses.json'));
const MarcRecord = require('marc-record-js');
const execSync = require('child_process').execSync;

const SelectBetter = require('melinda-deduplication-common/select-better');

items.filter(item => {
  return item.label !== item.synapticLabel;
}).forEach(item => {

  const preferred = MarcRecord.clone(item.preferred);
  const other = MarcRecord.clone(item.other);

  fs.writeFileSync('/tmp/rec1', preferred.toString());
  fs.writeFileSync('/tmp/rec2', other.toString());

  console.log(readableMeta(item));
  const code = execSync('/usr/bin/meld /tmp/rec1 /tmp/rec2');
});

function readableMeta(item) {
  const humanLabel = item.label;
  const mlpLabel = item.synapticLabel;

  // NOTE that this generates the features on the fly, so if the implementation 
  // has changed the features may not be the ones used for training the network
  const features1 = SelectBetter.generateFeatures(item.preferred, SelectBetter.ExtractorPreset.Default);
  const features2 = SelectBetter.generateFeatures(item.other, SelectBetter.ExtractorPreset.Default);

  const features1Str = features1.map(feature => `${feature.name}: ${feature.value}`).map(str => '    ' + str).join('\n');
  const features2Str = features2.map(feature => `${feature.name}: ${feature.value}`).map(str => '    ' + str).join('\n');

  return `
  humanLabel: ${humanLabel}
  computerLabel: ${mlpLabel}
  features_first: \n${features1Str}
  features_second: \n${features2Str}
  `;
}
/*
 numericProbability: ${item.probability.numeric}
  features: 
${featureList}
*/
