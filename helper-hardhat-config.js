const { network } = require("hardhat");

const developmentChain = ["hardhat", "localhost"].includes(network.name);

const networkConfig = {
  goerli: {
    vrfCoordinator: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
    gasLane:
      "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
  },
};

module.exports = {
  developmentChain,
  networkConfig,
};
