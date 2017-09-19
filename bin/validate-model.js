#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const _ = require('lodash');
const synaptic = require('synaptic');
const utils = require('./utils');
const Network = synaptic.Network;

const exported = JSON.parse(fs.readFileSync('/tmp/select-better-perceptron.json', 'utf8'));
console.log('loaded /tmp/select-better-perceptron.json');
var importedNetwork = Network.fromJSON(exported);

run().catch(error => console.error(error));

async function run() {
  const recordSetData = await utils.readStdin();
  const trainingSet = JSON.parse(recordSetData);

  const items = shuffle(trainingSet);

  const len = items.length;
  const probabilities = items.map((item, i) => {
    if (i%10 === 0) {
      console.log(`${i}/${len}`);
    }

    const synapticProbability = importedNetwork.activate(item.input)[0];
    return Object.assign({}, item, { synapticProbability });
  });

  const PROBABILITY_THRESHOLD = 0.5;

  const guesses = probabilities.map(item => {

    const label = item.output[0] === 0 ? 'FIRST_IS_BETTER' : 'SECOND_IS_BETTER';
    const synapticLabel = item.synapticProbability < PROBABILITY_THRESHOLD ? 'FIRST_IS_BETTER' : 'SECOND_IS_BETTER';

    const correct = label === synapticLabel;
    

    return Object.assign({}, item, { label, synapticLabel, correct });
  });

  const labels = guesses.map(guess => `${guess.label} ${guess.synapticProbability} ${id(guess.preferred)} ${id(guess.other)}`).join('\n');
  fs.writeFileSync('/tmp/select-better-guessLabels.txt', labels, 'utf8');
  console.log('wrote /tmp/select-better-guessLabels.txt');

  const correct = guesses.filter(item => item.correct);
  const correctPercentage = Math.round((correct.length / guesses.length * 100) * 100) / 100;
  console.log(`Correct: ${correct.length}/${guesses.length} (${correctPercentage}%)`);

  fs.writeFileSync('/tmp/select-better-guesses.json', JSON.stringify(guesses), 'utf8');
  console.log('wrote /tmp/select-better-guesses.json');
  
}
function shuffle(array) {
  let currentIndex = array.length, temporaryValue, randomIndex;

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function id(record) {
  return _.get(record.fields.find(f => f.tag === '001'), 'value');
}
