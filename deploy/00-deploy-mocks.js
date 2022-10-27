const { network, ethers } = require("hardhat");
const { developmentChain } = require("../helper-hardhat-config");

const BASE_FEE = ethers.utils.parseEther("0.25"); // Premium (0.25 LINK per request)
const GAS_PRICE_LINK = 1e9; // LINK per gas

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  if (developmentChain) {
    log("Local network detected. Deploying mocks...");
    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      log: true,
      args: [BASE_FEE, GAS_PRICE_LINK],
    });
    log("Mocks deployed!");
  }
};
module.exports.tags = ["all", "mocks"];
