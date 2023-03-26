const {requestDataPackages} = require("redstone-sdk");
const {defaultCacheOptions, LoggerFactory, WarpFactory} = require('warp-contracts');

async function postBtcPrice(message, context) {
  // Extract the parameter from the Pub/Sub message
  const messageData = JSON.parse(Buffer.from(message.data, 'base64').toString());
  const contractTxId = messageData.contractTxId;

  const reqParams = {
    dataFeeds: ["BTC"],
    dataServiceId: "redstone-avalanche-prod",
    uniqueSignersCount: 1,
  };

  const dataPackagesResponse = await requestDataPackages(reqParams);
  const btc = dataPackagesResponse["BTC"][0];

  // turn off any logging within Warp
  LoggerFactory.INST.logLevel('none');
  const warp = WarpFactory.forMainnet({...defaultCacheOptions, inMemory: true});
  const wallet = await warp.arweave.wallets.generate();

  const contract = warp
    .contract(contractTxId)
    .connect(wallet);

  await contract.writeInteraction({
    function: 'train',
    pricePackage: btc.toJSON(),
  });
}

// Export the function as a Cloud Function
exports.postBtcPrice = postBtcPrice;