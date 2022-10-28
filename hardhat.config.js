require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    localhost: {
      utl: "http://localhost:8545",
      chainId: 31337,
      blockConfirmations: 1,
    },
    goerli: {
      url: process.env["GOERLI_RPC_URL"],
      accounts: [process.env["PRIVATE_KEY"]],
      chainId: 5,
      blockConfirmations: 6,
    },
  },
  etherscan: {
    apiKey: process.env["ETHERSCAN_API_KEY"],
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: process.env["COINMARKETCAP_API_KEY"],
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
};
