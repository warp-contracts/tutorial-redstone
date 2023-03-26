/* eslint-disable */
const {defaultCacheOptions, LoggerFactory, WarpFactory} = require('warp-contracts');
const {requestDataPackages} = require("redstone-sdk");
const fs = require('fs');
const path = require('path');
const {ArweaveSigner, DeployPlugin} = require("warp-contracts-plugin-deploy");

const brain = require('brain.js');

class RedStonePlugin  {
  process(input) {
    input.redstone = require("redstone-protocol");
  }

  type() {
    return 'smartweave-extension-redstone';
  }
}

class BrainJsPlugin {
  constructor() {
  }

  process(input) {
    input.LSTMTimeStep = brain.recurrent.LSTMTimeStep;
  }

  type() {
    return 'smartweave-extension-brain';
  }
}

async function main() {
  let wallet = readJSON('./.secrets/33F0QHcb22W7LwWR1iRC8Az1ntZG09XQ03YWuw2ABqA.json');
  // LoggerFactory.INST.logLevel('error');
  LoggerFactory.INST.logLevel('info');

  try {
    const warp = WarpFactory
      .forMainnet({...defaultCacheOptions, inMemory: false})
      .use(new DeployPlugin())
      .use(new RedStonePlugin())
      .use(new BrainJsPlugin())


    /*const jsContractSrc = fs.readFileSync(path.join('./lstm-redstone.js'), 'utf8');

    const {contractTxId, srcTxId} = await warp.deploy({
      wallet: new ArweaveSigner(wallet),
      initState: JSON.stringify({}),
      src: jsContractSrc,
      evaluationManifest: {
        evaluationOptions: {
          useConstructor: true
        }
      }
    });

    console.log('contractTxId:', contractTxId);
    console.log('srcTxId:', srcTxId);*/

    const contract = warp
      .contract(/*contractTxId*/"TZk31WrAGpjIUAWb8y6rU8FIAVRoEr7qcOz5uqsIda0")
      .connect(wallet);

    const reqParams = {
      dataFeeds: ["BTC"],
      dataServiceId: "redstone-avalanche-prod",
      uniqueSignersCount: 1,
    }

    const dataPackagesResponse = await requestDataPackages(reqParams);
    const btc = dataPackagesResponse["BTC"][0];
    await contract.writeInteraction({
      function: 'train',
      pricePackage: btc.toJSON(),
    });


    const {cachedValue} = await contract.readState();
    console.dir(cachedValue.state.trainData, {depth: null});

   /* const view = await contract.viewState({
      function: 'forecast',
      pricePackage: btc.toJSON()
    });
    console.dir(view.result);*/
  } catch (e) {
    throw e;
  }
}

function readJSON(path) {
  const content = fs.readFileSync(path, 'utf-8');
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error(`File "${path}" does not contain a valid JSON`);
  }
}

main().catch((e) => console.error(e));
