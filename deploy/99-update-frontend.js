const { ethers, network } = require("hardhat");
const fs = require("fs");

const FRONTEND_LOCATION = process.env.FRONTEND_LOCATION;
const ADDRESSES_FILE = `${FRONTEND_LOCATION}/constants/contractAddresses.json`;
const ABI_FILE = `${FRONTEND_LOCATION}/constants/abi.json`;

module.exports = async () => {
  if (FRONTEND_LOCATION) {
    await updateContractAddresses();
    await updateAbi();
    console.log("Frontend updated");
  }
};

async function updateContractAddresses() {
  const chainId = network.config.chainId;
  const lottery = await ethers.getContract("Lottery");
  const addresses = JSON.parse(fs.readFileSync(ADDRESSES_FILE, "utf-8"));

  if (chainId in addresses && !addresses[chainId].includes(lottery.address)) {
    addresses[chainId].push(lottery.address);
  } else {
    addresses[chainId] = [lottery.address];
  }

  fs.writeFileSync(ADDRESSES_FILE, JSON.stringify(addresses));
}

async function updateAbi() {
  const lottery = await ethers.getContract("Lottery");
  fs.writeFileSync(
    ABI_FILE,
    lottery.interface.format(ethers.utils.FormatTypes.json)
  );
}

module.exports.tags = ["all", "frontend"];
