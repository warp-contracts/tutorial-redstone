const brain = require('brain.js');

const seedrandom = require('seedrandom');
Math.random = seedrandom('your-seed-value');

const net = new brain.recurrent.LSTMTimeStep({
  inputSize: 1,
  hiddenLayers: [20, 20],
  outputSize: 1,
});

const historicalBTCData = {
  '2023-03-01': 29174.58745339546,
  '2023-03-02': 29274.58743339546,
  '2023-03-03': 29124.58743229546,
  '2023-03-04': 28124.3223422,
  '2023-03-05': 29333.23423,
  '2023-03-06': 30000.234234234,
  '2023-03-07': 29888.32423433,
};

const prices = Object.values(historicalBTCData);
const priceDiffs = prices.slice(1).map((price, index) => price - prices[index]);

//console.log(priceDiffs);

const minDiff = Math.min(...priceDiffs);
const maxDiff = Math.max(...priceDiffs);

const normalize = (value) => (value - minDiff) / (maxDiff - minDiff);
const denormalize = (value) => value * (maxDiff - minDiff) + minDiff;

console.log(priceDiffs.map(normalize))
const normalizedPriceDiffs = priceDiffs.map(normalize)/*.map(value => [value])*/;

console.log([normalizedPriceDiffs]);

net.train([normalizedPriceDiffs], {
  iterations: 2000,
  log: (stats) => console.log(stats),
  errorThresh: 0.005,
  gpu: false
});

const daysToForecast = 3;
const forecastNormalizedDiffs = net.forecast(normalizedPriceDiffs.slice(-3), daysToForecast);
const forecastDiffs = forecastNormalizedDiffs.map(denormalize);

let lastPrice = prices[prices.length - 1];
const forecastPrices = forecastDiffs.map((diff) => {
  lastPrice += diff;
  return lastPrice;
});

console.log('Predicted Prices:', forecastPrices);
