const { getNamedAccounts, ethers, network } = require("hardhat");
const { developmentChain, networkConfig } = require("../helper-hardhat-config");

async function main() {
  if (!developmentChain && process.env["ETHERSCAN_API_KEY"]) {
    const { deployer } = await getNamedAccounts();
    const lottery = await ethers.getContract("Lottery", deployer);
    const config = networkConfig[network.config.chainId];
    const entranceFee = config.entranceFee;
    const gasLane = config.gasLane;
    const callbackGasLimit = config.callbackGasLimit;
    const interval = config.interval;
    const vrfCoordinatorAddress = config.vrfCoordinator;
    const subscriptionId = config.subscriptionId;
    const args = [
      vrfCoordinatorAddress,
      entranceFee,
      gasLane,
      subscriptionId,
      callbackGasLimit,
      interval,
    ];

    // Verify with etherscan
    console.log("Verifying contract...");
    try {
      await run("verify:verify", {
        address: lottery.address,
        constructorArguments: args,
      });
      console.log("Contract verified");
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  }
}

main().then(() => process.exit(0));
