const { run, network, ethers } = require("hardhat");
const { developmentChain, networkConfig } = require("../helper-hardhat-config");

const VRF_FUND_AMOUNT = ethers.utils.parseEther("2");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfCoordinator, gasLane, subscriptionId;

  if (developmentChain) {
    vrfCoordinator = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
    const transactionResponse = await vrfCoordinator.createSubscription();
    const transactionReceipt = await transactionResponse.wait(1);
    subscriptionId = transactionReceipt.events[0].args.subId;
    await vrfCoordinator.fundSubscription(subscriptionId, VRF_FUND_AMOUNT);
  } else {
    vrfCoordinator = networkConfig[chainId].vrfCoordinator;
    gasLane = networkConfig[chainId].gasLane;
    subscriptionId = networkConfig[chainId].subscriptionId;
  }

  const entranceFee = networkConfig[chainId].entranceFee;
  const callbackGasLimit = networkConfig[chainId].callbackGasLimit;
  const interval = networkConfig[chainId].interval;

  const args = [
    vrfCoordinator.address,
    entranceFee,
    gasLane,
    subscriptionId,
    callbackGasLimit,
    interval,
  ];

  const lottery = await deploy("Lottery", {
    from: deployer,
    args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
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
