import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { createRequire } from "module"; 

const require = createRequire(import.meta.url); 
const camp = require("./artifacts/contracts/lock.sol/camp.json"); 

dotenv.config({ path: "./.env.local" });

const main = async () => {
    console.log("RPC URL:", process.env.NEXT_PUBLIC_RPC_URL);
    console.log("Contract Address:", process.env.NEXT_PUBLIC_ADDRESS);

    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_ADDRESS,
        camp.abi,
        provider
    );

    const latestBlock = await provider.getBlockNumber(); // Get the latest block number
    const step = 50000; // Query logs in chunks of 50,000 blocks

    let allEvents = [];

    for (let startBlock = 0; startBlock < latestBlock; startBlock += step) {
        const endBlock = Math.min(startBlock + step - 1, latestBlock);

        console.log(`Querying logs from block ${startBlock} to ${endBlock}...`);

        try {
            const events = await contract.queryFilter(
                contract.filters.campcreated(),
                startBlock,
                endBlock
            );

            allEvents = allEvents.concat(events);
        } catch (error) {
            console.error(`Error fetching logs from block ${startBlock} to ${endBlock}:`, error);
        }
    }

    console.log("Total Events Fetched:", allEvents.length);
    console.log(allEvents.reverse());
};

main().catch((error) => {
    console.error("Error:", error);
});
