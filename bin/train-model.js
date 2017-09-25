/* eslint-disable no-console */

const fs = require('fs');
const synaptic = require('synaptic');
const utils = require('./utils');

const {hrtimeToMs, msToTime} = require('melinda-deduplication-common/utils/utils');

let start = hrtimeToMs(process.hrtime());

run().catch(error => {
  console.error(error);
});

async function run() {

  const recordSetData = await utils.readStdin();

  const trainingSet = JSON.parse(recordSetData);

  
  const INPUTS = trainingSet[0].input.length;
  const OUTPUTS = 1;
  const LAYER_1 = Math.round(Math.sqrt((OUTPUTS+2)*INPUTS)) + Math.round(2 * Math.sqrt(INPUTS/(OUTPUTS+2)));
  const LAYER_1_2 = Math.round(Math.sqrt((OUTPUTS+2)*INPUTS)) + Math.round(2 * Math.sqrt(INPUTS/(OUTPUTS+2)));
  const LAYER_2 = OUTPUTS * Math.round(Math.sqrt(INPUTS/(OUTPUTS+2)));
  
  const architecture = [INPUTS, Math.floor(INPUTS/2), OUTPUTS];

  const model = new synaptic.Architect.Perceptron(...architecture);
  
  model.layers.hidden[0].list.forEach(neuron => {
    neuron.squash = synaptic.Neuron.squash.TANH;
  });

  console.log('Architecture', ...architecture);
  console.log('trainingset size', trainingSet.length);
  
  const ITERATIONS = 9000;

  const trainer = new synaptic.Trainer(model);
  const opts = {
    rate: [0.005, 0.0025, 0.001, 0.0005],
    iterations: ITERATIONS,
    error: .001,
    shuffle: true,
    cost: synaptic.Trainer.cost.MSE,
    schedule: {
      every: 10,
      do: function(data) {
  
        let now = hrtimeToMs(process.hrtime());
        
        const delta = now - start;
        const perItem = delta / data.iterations;
        const totalTime = perItem * ITERATIONS;
        
        console.log(`iterations ${data.iterations} error ${data.error} rate ${data.rate} estimated runtime: ${msToTime(totalTime)}, time left: ${msToTime(totalTime - delta)}`);
      }
    }
  };

  const result = trainer.train(trainingSet, opts);
  console.log(result);

  const exported = model.toJSON();
  fs.writeFileSync('/tmp/select-better-perceptron.json', JSON.stringify(exported), 'utf8');
  console.log('wrote /tmp/select-better-perceptron.json');

}

