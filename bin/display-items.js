const _ = require('lodash');
const fs = require('fs');
const items = JSON.parse(fs.readFileSync('/tmp/select-better-guesses.json'));
const MarcRecord = require('marc-record-js');
const execSync = require('child_process').execSync;
const Table = require('easy-table');
const RecordUtils = require('melinda-deduplication-common/utils/record-utils');

const SelectBetter = require('melinda-deduplication-common/select-better');

const startFrom = process.argv[2] || 0;

const incorrectItems = items.filter(item => {
  return item.label !== item.synapticLabel;
});

incorrectItems.forEach((item, i) => {
  if ((i+1) < startFrom) {
    return;
  }

  const preferred = MarcRecord.clone(item.preferred);
  const other = MarcRecord.clone(item.other);

  fs.writeFileSync('/tmp/rec1', preferred.toString());
  fs.writeFileSync('/tmp/rec2', other.toString());

  console.log(`Item: ${i + 1}/${incorrectItems.length}`);
  console.log(readableMeta(item));
  execSync('/usr/bin/meld /tmp/rec1 /tmp/rec2');
});

function readableMeta(item) {
  const id1 = RecordUtils.selectRecordId(item.preferred);
  const id2 = RecordUtils.selectRecordId(item.other);

  const humanLabel = item.label;
  const mlpLabel = item.synapticLabel;
  const probability = item.synapticProbability;
  // NOTE that this generates the features on the fly, so if the implementation 
  // has changed the features may not be the ones used for training the network
  const features1 = SelectBetter.generateFeatures(item.preferred, SelectBetter.ExtractorPreset.Default);
  const features2 = SelectBetter.generateFeatures(item.other, SelectBetter.ExtractorPreset.Default);

  const vector1 = SelectBetter.generateFeatureVector(features1);
  const vector2 = SelectBetter.generateFeatureVector(features2);

  SelectBetter.normalizeFeatureVectors(vector1, vector2, SelectBetter.ExtractorPreset.Default);
  
  const t = createTable(features1, features2, vector1, vector2);

  const differents = _.unzip(_.zip(features1, features2, vector1, vector2).filter(item => item[2] !== item[3]));
  let t_diffs;
  try {
    t_diffs = createTable(...differents);
  } catch(e) {
    t_diffs = new Table();
  }

  return `
  ----
  features: \n\n${t.printTransposed()}

  pair: ${id1}-${id2}
  humanLabel: ${humanLabel}
  computerLabel: ${mlpLabel}
  numeric: ${probability}
  different: \n\n${t_diffs.printTransposed()}
  `;
}

function createTable(features1, features2, vector1, vector2) {

  var t = new Table();

  features1.forEach(function(feature) {
    t.cell(feature.name, getFeatureValueString(feature));
  });
  t.newRow();
  features2.forEach(function(feature) {
    t.cell(feature.name, getFeatureValueString(feature));
  });
  t.newRow();
  features1.forEach(function(feature, i) {
    t.cell(feature.name, vector1[i]);
  });
  t.newRow();
  features2.forEach(function(feature, i) {
    t.cell(feature.name, vector2[i]);
  });
  t.newRow();

  return t;
}

function getFeatureValueString(feature) {
  if (feature.name === 'reprintInfo') {
    const year = _.get(feature.value, 'year');
    const notes = _.get(feature.value, 'notesOnReprints', []);
    
    return `${year}-${notes.join()}`;
  }
  return feature.value;
}

/*
 numericProbability: ${item.probability.numeric}
  features: 
${featureList}
*/
