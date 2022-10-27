const { network } = require("hardhat");
const { developmentChain } = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  if (developmentChain) {
    log("Local network detected. Deploying mocks...");
    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      log: true,
      args: [0 /* baseFee */, 0 /* gasPriceLink */],
    });
    log("Mocks deployed!");
  }
};
module.exports.tags = ["all", "mocks"];
