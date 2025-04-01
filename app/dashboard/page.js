//serverside

"use client";
import styled from "styled-components";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import camp from "../../artifacts/contracts/lock.sol/camp.json";
import Link from "next/link";

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        console.log("Starting to fetch campaigns...");

        // Validate environment variables
        if (!process.env.NEXT_PUBLIC_ADDRESS) {
          throw new Error("NEXT_PUBLIC_ADDRESS is not set in the environment variables.");
        }
        if (!process.env.NEXT_PUBLIC_PRIVATE_KEY) {
          throw new Error("NEXT_PUBLIC_PRIVATE_KEY is not set in the environment variables.");
        }

        // Validate contract address
        if (!ethers.isAddress(process.env.NEXT_PUBLIC_ADDRESS)) {
          throw new Error("Invalid contract address in environment variables.");
        }

        // Connect to the provider and wallet
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const network = await provider.getNetwork();

        // Check if the user is connected to Holesky
        if (network.chainId !== 17000n) {
          throw new Error("Please connect to the Holesky network.");
        }

        const wallet = new ethers.Wallet(process.env.NEXT_PUBLIC_PRIVATE_KEY, provider);

        console.log("Wallet Address from Private Key:", wallet.address);

        // Connect to the main contract
        const contractAddress = process.env.NEXT_PUBLIC_ADDRESS;
        const contract = new ethers.Contract(contractAddress, camp.abi, wallet);

        // Fetch campaigns created by the user
        const campaignsInRange = await contract.queryFilter(contract.filters.campcreated());
        const userCampaigns = campaignsInRange.filter(
          (event) => event.args.owner.toLowerCase() === wallet.address.toLowerCase()
        );

        // Map campaigns to a readable format
        const formattedCampaigns = await Promise.all(
          userCampaigns.map(async (event) => {
            let displayAddress = `${event.args.campaddress.slice(0, 6)}...${event.args.campaddress.slice(-4)}`;
            let ensName = null;

            try {
              ensName = await provider.lookupAddress(event.args.campaddress); // Reverse ENS lookup
              if (ensName) displayAddress = ensName;
            } catch (ensError) {
              console.log("ENS not set or network issue:", ensError);
            }

            return {
              address: event.args.campaddress,
              title: event.args.Title || displayAddress,
              image: event.args.campImage,
              category: event.args.category,
              timestamp: event.args.timestamp,
            };
          })
        );

        setCampaigns(formattedCampaigns);
      } catch (err) {
        console.error("Error fetching campaigns:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  if (loading) {
    return <p>Loading campaigns...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <DashboardWrapper>
      <h1>Your Campaigns</h1>
      {campaigns.length === 0 ? (
        <p>You have not created any campaigns yet.</p>
      ) : (
        <CampaignList>
          {campaigns.map((campaign) => (
            <li key={campaign.address}>
              <Link href={`/dashboard/${campaign.address}`}>
                <p>{campaign.title || campaign.address}</p>
              </Link>
            </li>
          ))}
        </CampaignList>
      )}
    </DashboardWrapper>
  );
}

const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  font-family: "Poppins", sans-serif;

  h1 {
    font-size: 2rem;
    color: ${(props) => props.theme.color};
  }

  p {
    font-size: 1.2rem;
    color: ${(props) => props.theme.color};
  }
`;

const CampaignList = styled.ul`
  list-style: none;
  padding: 0;

  li {
    margin: 10px 0;

    p {
      text-decoration: none;
      color: ${(props) => props.theme.color};
      font-size: 1.2rem;
    }
  }
`;