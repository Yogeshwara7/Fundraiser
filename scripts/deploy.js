const hre = require("hardhat");

async function main() {
    // Get the ContractFactory for the camp contract
    const Camp = await hre.ethers.getContractFactory("camp");

    // Deploy the camp contract
    console.log("Deploying contract...");
    const camp = await Camp.deploy();

    // Wait for the camp contract to be deployed
    console.log("Waiting for deployment to complete...");
    await camp.waitForDeployment();

    // Log the camp contract address
    const campadd= await camp.getAddress();
    console.log("Camp deployed to:", campadd);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });