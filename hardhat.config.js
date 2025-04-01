require("@nomicfoundation/hardhat-toolbox");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env.local') });

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});

const privatekey = process.env.NEXT_PUBLIC_PRIVATE_KEY;

module.exports = {
  solidity: "0.8.28",
  defaultNetwork: "Holesky",
  networks: {
    hardhat:{},
    Holesky: {
      url: process.env.NEXT_PUBLIC_RPC_URL,
      accounts: [privatekey],
    },
  },
};