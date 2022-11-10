const { getNamedAccounts, ethers } = require("hardhat");
const { developmentChain } = require("../helper-hardhat-config");

async function main() {
  if (!developmentChain) {
    console.error("Not a development chain");
    process.exit(1);
  }
  const { deployer } = await getNamedAccounts();
  const lottery = await ethers.getContract("Lottery", deployer);
  const vrfCoordinator = await ethers.getContract("VRFCoordinatorV2Mock");

  await new Promise(async (resolve, reject) => {
    lottery.once("WinnerPick", async () => {
      const winner = await lottery.getRecentWinner();
      console.log(`The winner is ${winner}`);
      resolve();
    });
    const txResponse = await lottery.performUpkeep([]);
    const txReceipt = await txResponse.wait(1);
    const requestId = vrfCoordinator.interface.parseLog(txReceipt.events[0])
      .args.requestId;
    await vrfCoordinator.fulfillRandomWords(requestId, lottery.address);
  });
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
