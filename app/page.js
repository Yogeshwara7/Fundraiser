
"use client";

import styled from "styled-components";
import { useEffect, useState } from "react";
import camp from "../artifacts/contracts/lock.sol/camp.json";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import PaidIcon from "@mui/icons-material/Paid";
import EventIcon from "@mui/icons-material/Event";
import Link from "next/link";
import { Button } from "@mui/material";
import { JsonRpcProvider, Contract } from "ethers";
import { ethers } from "ethers";

export default function Index() {
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🏷️ Use the correct Pinata gateway URL
  const ipfsGateway = "https://black-high-hyena-919.mypinata.cloud/ipfs/";
  const rpc = "https://ethereum-holesky-rpc.publicnode.com";
  const contractaddress = "0xe83f5ed750f4617EE09Ef2dd0036220eaCEAF99a"; // Replace with your contract address

  // 🏷️ Fetch campaigns from the blockchain
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        console.log("Fetching campaigns...");

        const provider = new ethers.JsonRpcProvider(rpc);
        const contract = new ethers.Contract(contractaddress, camp.abi, provider);

        const latestBlock = await provider.getBlockNumber();
        console.log("Latest Block:", latestBlock);

        const deploymentBlock = 0; // Replace with the actual deployment block number
        const batchSize = 40000; // Query in batches of 40000 blocks
        let fromBlock = deploymentBlock;
        let toBlock = Math.min(fromBlock + batchSize - 1, latestBlock);
        let allEvents = [];

        while (fromBlock <= latestBlock) {
          console.log(`Querying from block ${fromBlock} to ${toBlock}...`);
          const events = await contract.queryFilter(contract.filters.campcreated(), fromBlock, toBlock);
          allEvents.push(...events);

          fromBlock = toBlock + 1;
          toBlock = Math.min(fromBlock + batchSize - 1, latestBlock);
        }

        console.log("Fetched Campaign Events:", allEvents);

        const allCampaigns = allEvents.map((e) => {
          let cid = e.args?.campImage;
          let formattedImage = cid && cid.startsWith("Qm") ? `${ipfsGateway}${cid}` : null;

          return {
            title: e.args?.Title || "No Title Available",
            img: formattedImage,
            owner: e.args?.owner || "Unknown",
            timestamp: Number(e.args?.timestamp) || 0,
            requiredAmount: ethers.formatEther(e.args?.RequiredAmount || "0"),
            category: e.args?.category || "General",
            campaignAddress: e.args?.campaddress,
          };
        });

        const sortedCampaigns = allCampaigns.sort((a, b) => b.timestamp - a.timestamp);
        console.log("Sorted Campaigns:", sortedCampaigns);

        setCampaigns(sortedCampaigns);
        setFilteredCampaigns(sortedCampaigns);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching campaigns:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  // 🏷️ Filter campaigns by category
  const filterCampaigns = (category) => {
    if (category === "All") setFilteredCampaigns(campaigns);
    else setFilteredCampaigns(campaigns.filter((e) => e.category === category));
  };

  return (
    <HomeWrapper>
      {/* 🔍 Filter Section */}
      <FilterWrapper>
        <FilterAltIcon style={{ fontSize: 40 }} />
        {["All", "Education", "Health", "Gaming", "Animal", "Social Media", "Music"].map((category) => (
          <Category key={category} onClick={() => filterCampaigns(category)}>
            {category}
          </Category>
        ))}
      </FilterWrapper>

      {/* 🎴 Cards Section */}
      <CardsWrapper>
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : error ? (
          <p style={{ color: "red" }}>Error: {error}</p>
        ) : filteredCampaigns.length > 0 ? (
          filteredCampaigns.map((e, index) => (
            <Card key={index}>
              <CardImg>
                {e.img ? (
                  <img
                    src={e.img}
                    onError={(event) => {
                      // If the image fails to load, hide it
                      event.target.style.display = "none";
                    }}
                    alt="Campaign Image"
                    style={{ width: "100%", height: "200px", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "200px",
                      backgroundColor: "#f0f0f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#666",
                      fontSize: "16px",
                    }}
                  >
                    No Image Available
                  </div>
                )}
              </CardImg>
              <Title>{e.title}</Title>
              <CardData>
                <Text>Owner <AccountBoxIcon /></Text>
                <Text>{e.owner.slice(0, 6)}...{e.owner.slice(-4)}</Text>
              </CardData>
              <CardData>
                <Text>Amount <PaidIcon /></Text>
                <Text>{isNaN(e.requiredAmount) ? "N/A" : e.requiredAmount}</Text>
              </CardData>
              <CardData>
                <Text><EventIcon /></Text>
                <Text>
                  {isNaN(e.timestamp)
                    ? "Invalid Date"
                    : new Date(e.timestamp * 1000).toLocaleString()}
                </Text>
              </CardData>
              <Link href={`/campaign/${e.owner}`} passHref>
                <StyledButton>Check Campaign</StyledButton>
              </Link>
            </Card>
          ))
        ) : (
          <p>No campaigns available.</p>
        )}
      </CardsWrapper>
    </HomeWrapper>
  );
}

// 🎨 Styled Component
// 🎨 Styled Components
const HomeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 20px;
`;

const FilterWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin-top: 15px;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
`;

const Category = styled.div`
  padding: 10px 15px;
  background-color: ${(props) => props.theme.bgDiv};
  border-radius: 8px;
  font-family: "Poppins";
  font-weight: normal;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${(props) => props.theme.bgDivHover};
  }
`;

const CardsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  width: 100%;
  max-width: 1200px;
  margin-top: 25px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 300px;
  background-color: ${(props) => props.theme.bgDiv};
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const CardImg = styled.div`
  position: relative;
  height: 200px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
`;

const Title = styled.h3`
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  margin-top: 10px;
  color: ${(props) => props.theme.text};
`;

const StyledButton = styled(Button)`
  width: 100%;
  margin-top: 10px !important;
  background-color: #00b712 !important;
  color: white !important;
  font-weight: bold !important;
  text-transform: uppercase !important;
`;

const CardData = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  font-size: 16px;
  font-family: "Poppins";
  color: ${(props) => props.theme.text};
`;

const Text = styled.p`
  margin: 0;
`;