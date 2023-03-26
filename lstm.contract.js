export async function handle(state, action) {
  const input = action.input;

  // constructor - https://docs.warp.cc/docs/sdk/advanced/constructor
  if (input.function === '__init') {
    // redstone-avalanche-prod nodes
    state.redstoneAuthorizedSigners = [
      '0x1eA62d73EdF8AC05DfceA1A34b9796E937a29EfF',
      '0x2c59617248994D12816EE1Fa77CE0a64eEB456BF',
      '0x12470f7aBA85c8b81D63137DD5925D6EE114952b',
      '0x109B4a318A4F5ddcbCA6349B45f881B4137deaFB',
      '0x83cbA8c619fb629b81A65C2e67fE15cf3E3C9747'
    ];

    state.trainedData = [];
    state.toTrain = [];

    state.serializedModel = null;

    return {state};
  }

  if (input.function === 'train') {
    const pricePackage = input.pricePackage;

    const priceWithTimestamp = extractValueFromPricePackage(pricePackage, state.redstoneAuthorizedSigners);
    logger.info('train:', priceWithTimestamp);
    state.toTrain.push(priceWithTimestamp);

    if (state.toTrain.length == 5) {
      logger.info('training');
      doTrain(state);
    }

    return {state};
  }

  if (input.function === 'predict') {
    if (state.serializedModel === null) {
      throw new ContractError('Not enough train data yet!');
    }

    const forecastInput = input.prices;
    if (forecastInput?.length == 0) {
      throw new ContractError('Not enough input prices to forecast')
    }

    if (forecastInput.length > 10) {
      throw new ContractError('Too many input prices');
    }

    const toPredict = input.toPredict;
    if (toPredict > forecastInput.length) {
      throw new ContractError('Too many values to forecast');
    }

    const net = createNetwork();
    net.fromJSON(state.serializedModel);

    const {minDiff, maxDiff, normalizedDiffs} = preparePrices(forecastInput);

    const forecastNormalizedDiffs = net.forecast(normalizedDiffs, toPredict);
    const forecastDiffs = forecastNormalizedDiffs.map(d => denormalize(d, minDiff, maxDiff));
    let lastPrice = forecastInput[forecastInput.length - 1];
    const forecastPrices = forecastDiffs.map((diff) => {
      lastPrice += diff;
      return lastPrice;
    });

    return {
      result: forecastPrices,
    }
  }

  throw new ContractError(`Unknown contract function ${input.function}`);
}

function extractValueFromPricePackage(pricePackage, authorizedSigners) {
  // redstone-protocol extension
  const redstone = SmartWeave.extensions.redstone;

  const pricePackageObj = JSON.parse(pricePackage);
  const signedDataPackage = redstone.SignedDataPackage.fromObj(pricePackageObj);
  const recoveredSignerAddress = signedDataPackage.recoverSignerAddress();

  if (!authorizedSigners.includes(recoveredSignerAddress)) {
    throw new ContractError(`Unauthorized price package signer: ${recoveredSignerAddress}`);
  }

  // TODO: how to get value directly from 'signedDataPackage'?
  return {v: pricePackageObj.dataPoints[0].value, t: pricePackageObj.timestampMilliseconds};
}

function doTrain(state) {
  const net = createNetwork();
  if (state.serializedModel) {
    net.fromJSON(state.serializedModel);
  }

  logger.info('toTrain', state.toTrain);

  let firstElementAdded = false;
  if (state.trainedData?.length) {
    // get last element (if available) from already trained data to properly calculate
    // the diff for the first element of the new data
    state.toTrain = [state.trainedData[state.trainedData.length - 1], ...state.toTrain];
    firstElementAdded = true;
  }

  const {normalizedDiffs} = preparePrices(state.toTrain.map(p => p.v));

  net.train([normalizedDiffs], {
    iterations: 2000,
    log: (stats) => logger.debug(stats),
    errorThresh: 0.005
  });

  state.serializedModel = net.toJSON();
  if (firstElementAdded) {
    state.toTrain.shift();
  }
  state.trainedData.push(...state.toTrain);
  state.toTrain = [];

  // logger.info('after train state.trainData', state.trainData);
}

function preparePrices(prices) {
  const priceDiffs = calculateDiffs(prices);
  const minDiff = Math.min(...priceDiffs);
  const maxDiff = Math.max(...priceDiffs);
  const normalizedDiffs = priceDiffs
    .map(d => normalize(d, minDiff, maxDiff));

  return {
    minDiff,
    maxDiff,
    normalizedDiffs
  };
}

function normalize(value, min, max) {
  if (min === max || min > max) {
    throw new ContractError("Invalid range: min and max must be different and min must be smaller than max.");
  }
  return (value - min) / (max - min);
}

function denormalize(value, min, max) {
  return value * (max - min) + min;
}

function calculateDiffs(prices) {
  return prices.slice(1).map((price, index) => price - prices[index]);
}

function createNetwork() {
  return new SmartWeave.extensions.LSTMTimeStep({
    inputSize: 1,
    hiddenLayers: [10, 10],
    outputSize: 1,
  });
}