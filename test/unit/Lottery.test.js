const { assert } = require("chai");
const { getNamedAccounts, deployments, ethers } = require("hardhat");
const {
  developmentChain,
  networkConfig,
} = require("../../helper-hardhat-config");

!developmentChain
  ? describe.skip
  : describe("Lottery unit test", async function() {
      const chainId = network.config.chainId;
      let lottery, vrfCoordinatorMock;

      beforeEach(async function() {
        const { deployer } = getNamedAccounts();
        await deployments.fixture(["all"]);
        lottery = await ethers.getContract("Lottery", deployer);
        vrfCoordinatorMock = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );
      });

      describe("constructor", async function() {
        it("should initialize the contract correctly", async function() {
          const lotteryState = await lottery.getLotteryState();
          assert.equal(lotteryState.toString(), "0");
          const interval = await lottery.getInterval();
          assert.equal(interval.toString(), networkConfig[chainId].interval);
          const numberOfPlayers = await lottery.getNumberOfPlayers();
          assert.equal(numberOfPlayers.toString(), "0");
        });
      });
    });
