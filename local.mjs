import {join} from "path";
import {LoggerFactory, sleep, WarpFactory} from "warp-contracts";
import {DeployPlugin} from "warp-contracts-plugin-deploy";
import {BrainJsPlugin, RedStonePlugin} from "./warp-extensions.mjs";
import {readFileSync} from "fs";
import Arl from "arlocal";
import {requestDataPackages} from "redstone-sdk";
import seedrandom from 'seedrandom';

const CONTRACT_PATH = join("lstm.contract.js");
const warp = WarpFactory.forLocal(1411)
  .use(new DeployPlugin())
  .use(new RedStonePlugin())
  .use(new BrainJsPlugin());

const CONTRACT_CODE = readFileSync(CONTRACT_PATH).toString();
LoggerFactory.INST.logLevel('debug');

const arlocal = new Arl.default(1411, false);
await arlocal.start();

try {
  const {jwk: signer} = await warp.generateWallet();
  const {contractTxId} = await warp.deploy({
    wallet: signer,
    initState: JSON.stringify({}),
    src: CONTRACT_CODE,
    evaluationManifest: {
      evaluationOptions: {
        useConstructor: true
      }
    }
  });

  // don't try this at home!
  Math.random = seedrandom(contractTxId);

  const contract = warp.contract(contractTxId)
    .setEvaluationOptions({
      useVM2: true
    })
    .connect(signer);

  await contract.writeInteraction({
    function: 'train',
    pricePackage: (await getPricePackage()).toJSON(),
  });

  await sleep(1500);
  await contract.writeInteraction({
    function: 'train',
    pricePackage: (await getPricePackage()).toJSON(),
  });

  await sleep(1500);
  await contract.writeInteraction({
    function: 'train',
    pricePackage: (await getPricePackage()).toJSON(),
  });

  await sleep(1500);
  await contract.writeInteraction({
    function: 'train',
    pricePackage: (await getPricePackage()).toJSON(),
  });

  await sleep(1500);
  await contract.writeInteraction({
    function: 'train',
    pricePackage: (await getPricePackage()).toJSON(),
  });

  const result = await contract.viewState({
    function: 'predict',
    prices: [30000, 30010, 30005, 30020, 30015],
    toPredict: 3
  });
  console.dir(result.result);
  console.dir(result.state.trainedData);

  await contract.writeInteraction({
    function: 'train',
    pricePackage: (await getPricePackage()).toJSON(),
  });

  await sleep(1500);
  await contract.writeInteraction({
    function: 'train',
    pricePackage: (await getPricePackage()).toJSON(),
  });

  await sleep(1500);
  await contract.writeInteraction({
    function: 'train',
    pricePackage: (await getPricePackage()).toJSON(),
  });

  await sleep(1500);
  await contract.writeInteraction({
    function: 'train',
    pricePackage: (await getPricePackage()).toJSON(),
  });

  await sleep(1500);
  await contract.writeInteraction({
    function: 'train',
    pricePackage: (await getPricePackage()).toJSON(),
  });

  const result2 = await contract.viewState({
    function: 'predict',
    prices: [30000, 30010, 30005, 30020, 30015],
    toPredict: 3
  });
  console.dir(result2.result);
  console.dir(result2.state.trainedData);


  const read = await contract.readState();
  const size = Buffer.byteLength(JSON.stringify(read.cachedValue.state));

  console.log(size / 1024);

} finally {
  await arlocal.stop();
}

async function getPricePackage() {
  const reqParams = {
    dataFeeds: ["BTC"],
    dataServiceId: "redstone-avalanche-prod",
    uniqueSignersCount: 1,
  }
  const dataPackagesResponse = await requestDataPackages(reqParams);

  return dataPackagesResponse["BTC"][0];
}