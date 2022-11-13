const { run, network, ethers } = require("hardhat");
const { developmentChain, networkConfig } = require("../helper-hardhat-config");

const VRF_FUND_AMOUNT = ethers.utils.parseEther("2");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfCoordinator, vrfCoordinatorAddress, subscriptionId;

  if (developmentChain) {
    vrfCoordinator = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
    vrfCoordinatorAddress = vrfCoordinator.address;
    const transactionResponse = await vrfCoordinator.createSubscription();
    const transactionReceipt = await transactionResponse.wait(1);
    subscriptionId = transactionReceipt.events[0].args.subId;
    await vrfCoordinator.fundSubscription(subscriptionId, VRF_FUND_AMOUNT);
  } else {
    vrfCoordinatorAddress = networkConfig[chainId].vrfCoordinator;
    subscriptionId = networkConfig[chainId].subscriptionId;
  }

  const entranceFee = networkConfig[chainId].entranceFee;
  const gasLane = networkConfig[chainId].gasLane;
  const callbackGasLimit = networkConfig[chainId].callbackGasLimit;
  const interval = networkConfig[chainId].interval;
  const prizeRate = 90;

  const args = [
    vrfCoordinatorAddress,
    entranceFee,
    gasLane,
    subscriptionId,
    callbackGasLimit,
    interval,
    prizeRate,
  ];
  const lottery = await deploy("Lottery", {
    from: deployer,
    args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  // Add consumer to VRF subscription
  if (developmentChain) {
    await vrfCoordinator.addConsumer(subscriptionId, lottery.address);
  }

  if (!developmentChain && process.env["ETHERSCAN_API_KEY"]) {
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
    }
  }
};
module.exports.tags = ["all", "lottery"];
