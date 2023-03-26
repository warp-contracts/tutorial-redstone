const brain = require('brain.js');

const seedrandom = require('seedrandom');
Math.random = seedrandom('your-seed-value');


// Function to preprocess the data
function preprocessData(historicalBTCData) {
  const prices = Object.values(historicalBTCData);
  const normalized = prices.map((price, index, array) => {
    return index > 0 ? (price / array[index - 1]) - 1 : 0;

  });

  console.log(normalized);

  const trainingData = [];
  for (let i = 0; i < normalized.length - 5; i++) {
    trainingData.push(normalized.slice(i, i + 4).concat(normalized[i + 4]));
    console.log(trainingData)
  }

  console.log(trainingData);

  return trainingData;
}

// Example historical BTC price data
const historicalBTCData = {
  '2023-03-01': 29174.58745339546,
  '2023-03-02': 29274.58743339546,
  '2023-03-03': 29124.58743229546,
  '2023-03-04': 28124.3223422,
  '2023-03-05': 29333.23423,
  '2023-03-06': 30000.234234234,
  '2023-03-07': 29888.32423433,
};

// Preprocess the data
const trainingData = preprocessData(historicalBTCData);

// Create the LSTMTimeStep model
const lstm = new brain.recurrent.LSTMTimeStep({
  inputSize: 1,
  hiddenLayers: [20, 20],
  outputSize: 1,
});

// Train the LSTM model
lstm.train(trainingData, {
  iterations: 2000,
  log: (stats) => console.log(stats),
  logPeriod: 100,
  gpu: false
});

// Predict the next price
const lastFourNormalized = trainingData[trainingData.length - 1].slice(0, 4);
//console.log(lastFourNormalized);
const stepsToPredict = 1;
const predictionNormalized = lstm.forecast(lastFourNormalized, stepsToPredict);

// Convert the normalized prediction back to the actual price
const lastPrice = Object.values(historicalBTCData).pop();
//console.log(predictionNormalized);
const predictedPrice = lastPrice * (1 + predictionNormalized[0]);

console.log('Predicted BTC price:', predictedPrice);
