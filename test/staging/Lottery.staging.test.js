const { assert, expect } = require("chai");
const { resolveProperties } = require("ethers/lib/utils");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const {
  developmentChain,
  networkConfig,
} = require("../../helper-hardhat-config");

developmentChain
  ? describe.skip
  : describe("Lottery staging test", function() {
      const chainId = network.config.chainId;
      let lottery, deployer, entranceFee;

      beforeEach(async function() {
        deployer = (await getNamedAccounts()).deployer;
        lottery = await ethers.getContract("Lottery", deployer);
        entranceFee = await lottery.getEntranceFee();
      });

      describe("fulfillRandomWords", function() {
        it("picks the winner, resets the lottery and sends money", async function() {
          const accounts = await ethers.getSigners();
          const startingTimestamp = await lottery.getLatestTimestamp();

          await new Promise(async (resolve, reject) => {
            lottery.once("WinnerPick", async () => {
              console.log("Winner picked!");

              try {
                const recentWinner = await lottery.getRecentWinner();
                const endingTimestamp = await lottery.getLatestTimestamp();
                const lotteryState = await lottery.getLotteryState();
                const winnerEndingBalance = await accounts[0].getBalance();

                await expect(lottery.getPlayer(0)).to.be.reverted;
                assert.equal(recentWinner, accounts[0].address);
                assert(endingTimestamp.gt(startingTimestamp));
                assert.equal(lotteryState.toString(), "0");
                assert.equal(
                  winnerEndingBalance.toString(),
                  winnerStartingBalance.add(entranceFee).toString()
                );
              } catch (e) {
                reject(e);
              }
              resolve();
            });

            const txResponse = await lottery.enterLottery({
              value: entranceFee,
            });
            console.log("Entered lottery. Waiting for confirmation...");
            await txResponse.wait(1);
            const winnerStartingBalance = await accounts[0].getBalance();
            console.log(
              "Confirmation received. Balance:",
              winnerStartingBalance.toString()
            );
          });
        });
      });
    });
