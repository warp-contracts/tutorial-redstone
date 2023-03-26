export async function handle(state, action) {
  const input = action.input;

  // constructor - https://docs.warp.cc/docs/sdk/advanced/constructor
  if (input.function === '__init') {
    state.trainData = [];

    // redstone-avalanche-prod
    state.redstoneAuthorizedSigners = [
      '0x1eA62d73EdF8AC05DfceA1A34b9796E937a29EfF',
      '0x2c59617248994D12816EE1Fa77CE0a64eEB456BF',
      '0x12470f7aBA85c8b81D63137DD5925D6EE114952b',
      '0x109B4a318A4F5ddcbCA6349B45f881B4137deaFB',
      '0x83cbA8c619fb629b81A65C2e67fE15cf3E3C9747'
    ];

    state.serializedModel = null;
  }


  if (input.function === 'train') {
    const pricePackage = action.input.pricePackage;
    // redstone-protocol extension
    const redstone = SmartWeave.extensions.redstone;

    const pricePackageObj = JSON.parse(pricePackage);
    const signedDataPackage = redstone.SignedDataPackage.fromObj(pricePackageObj);
    const recoveredSignerAddress = signedDataPackage.recoverSignerAddress();
    if (!state.redstoneAuthorizedSigners.includes(recoveredSignerAddress)) {
      throw new ContractError(`Unauthorized price package signer: ${recoveredSignerAddress}`);
    }

    // TODO: how to get value directly from 'signedDataPackage'?
    state.trainData.push(pricePackageObj.dataPoints[0].value);

    if (state.trainData.length === 10) {
      doTrain(state);
    }

    return {state};
  }
}

function doTrain(state) {
  // brain-js extension
  const net = new SmartWeave.extensions.LSTMTimeStep();
  if (state.serializedModel) {
    net.fromJSON(state.serializedModel);
  }

  net.train([state.trainData]);

  state.trainData = [];
  state.serializedModel = net.toJSON();
}
