const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const {
  developmentChain,
  networkConfig,
} = require("../../helper-hardhat-config");

!developmentChain
  ? describe.skip
  : describe("Lottery unit test", function() {
      const chainId = network.config.chainId;
      let lottery, vrfCoordinatorMock, deployer, entranceFee, interval;

      beforeEach(async function() {
        await deployments.fixture(["all"]);
        deployer = (await getNamedAccounts()).deployer;
        lottery = await ethers.getContract("Lottery", deployer);
        vrfCoordinatorMock = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );
        entranceFee = await lottery.getEntranceFee();
        interval = await lottery.getInterval();
      });

      describe("constructor", function() {
        it("should initialize the contract correctly", async function() {
          const lotteryState = await lottery.getLotteryState();
          assert.equal(lotteryState.toString(), "0");
          assert.equal(interval.toString(), networkConfig[chainId].interval);
          const numberOfPlayers = await lottery.getNumberOfPlayers();
          assert.equal(numberOfPlayers.toString(), "0");
        });
      });

      describe("enterLottery", function() {
        it("should revert if don't send enough ETH", async function() {
          await expect(lottery.enterLottery()).to.be.revertedWith(
            "Lottery__NotEnoughETH"
          );
        });
        it("should add player to lottery", async function() {
          await lottery.enterLottery({
            value: entranceFee,
          });

          const player = await lottery.getPlayer(0);
          assert.equal(deployer, player);
        });
        it("should emit enter event", async function() {
          await expect(lottery.enterLottery({ value: entranceFee })).to.emit(
            lottery,
            "LotteryEnter"
          );
        });
        it("should not permit entrance while calculating", async function() {
          await lottery.enterLottery({ value: entranceFee });
          await time.increase(interval.toNumber() + 1);
          await lottery.performUpkeep([]);
          await expect(
            lottery.enterLottery({ value: entranceFee })
          ).to.be.revertedWith("Lottery__NotOpen");
        });
      });
      describe("checkUpkeep", async function() {
        it("should return false if there are no players", async function() {
          await time.increase(interval.toNumber() + 1);
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]);
          assert(!upkeepNeeded);
        });
        it("should return false if lottery isn't open", async function() {
          await lottery.enterLottery({ value: entranceFee });
          await time.increase(interval.toNumber() + 1);
          await lottery.performUpkeep([]);
          const state = await lottery.getLotteryState();
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]);
          assert.equal(state.toString(), "1");
          assert(!upkeepNeeded);
        });
        it("returns false if enough time has't passed", async function() {
          await lottery.enterLottery({ value: entranceFee });
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]);
          assert(!upkeepNeeded);
        });
        it("returns true when all conditions are met", async function() {
          await lottery.enterLottery({ value: entranceFee });
          await time.increase(interval.toNumber() + 1);
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]);
          assert(upkeepNeeded);
        });
      });
    });
