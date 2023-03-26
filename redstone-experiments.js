const {requestDataPackages} = require("redstone-sdk");

async function loadPrice() {
  const reqParams = {
    dataFeeds: ["BTC"],
    dataServiceId: "redstone-avalanche-prod",
    uniqueSignersCount: 1,
  }

  const dataPackagesResponse = await requestDataPackages(reqParams);
  const btc = dataPackagesResponse["BTC"][0];
  console.dir(SignedDataPackage.dataPackage.timestampMilliseconds);

  console.dir(btc.toJSON(), {depth: null});

  // post the price to the external service
}

loadPrice();

