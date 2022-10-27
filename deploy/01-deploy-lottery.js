const { run, network } = require("hardhat");
const { developmentChain, networkConfig } = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  let vrfCoordinator, gasLane;

  if (developmentChain) {
    vrfCoordinator = (await deployments.get("VRFCoordinatorV2Mock")).address;
  } else {
    vrfCoordinator = networkConfig[network.name].vrfCoordinator;
    gasLane = networkConfig[network.name].gasLane;
  }

  const args = [];

  const lottery = await deploy("Lottery", {
    from: deployer,
    args,
    log: true,
    waitConfirmations: network.config.waitConfirmations || 1,
  });

  if (!developmentChain && process.env["ETHERSCAN_API_KEY"]) {
    // Verify with etherscan
    console.log("Verifying contract...");
    run("verify:verify", {
      address: lottery.address,
      constructorArguments: args,
    })
      .then(() => console.log("Contract verified"))
      .catch((error) => console.log(error));
  }
};
