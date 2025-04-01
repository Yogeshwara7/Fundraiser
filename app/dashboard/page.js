"use client";
import styled from "styled-components";
import { useEffect, useState } from "react";
import camp from "../../artifacts/contracts/lock.sol/camp.json";
import { ethers } from "ethers";
import Link from "next/link";

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectedAddress, setConnectedAddress] = useState(null);

  // Request wallet connection
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask");
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts && accounts.length > 0) {
        setConnectedAddress(accounts[0]);
        fetchUserCampaigns(accounts[0]);
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
      setError(err.message);
    }
  };
  const fetchUserCampaigns = async (walletAddress) => {
    try {
      setLoading(true);
      setError(null);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_ADDRESS,
        camp.abi,
        provider
      );
  
      // Get current block number
      const latestBlock = await provider.getBlockNumber();
      const BATCH_SIZE = 1000; // Safe block range
      const MAX_RETRIES = 3;
      let fromBlock = 0; // Start from deployment block if known
      let allEvents = [];
  
      while (fromBlock <= latestBlock) {
        const toBlock = Math.min(fromBlock + BATCH_SIZE - 1, latestBlock);
        let retries = 0;
        let success = false;
  
        // Retry mechanism for each batch
        while (retries < MAX_RETRIES && !success) {
          try {
            console.log(`Fetching blocks ${fromBlock} to ${toBlock} (attempt ${retries + 1})`);
            
            const events = await contract.queryFilter(
              contract.filters.campcreated(),
              fromBlock,
              toBlock
            );
            
            allEvents.push(...events);
            success = true;
            
          } catch (err) {
            retries++;
            console.error(`Attempt ${retries} failed for blocks ${fromBlock}-${toBlock}:`, err);
            
            if (retries >= MAX_RETRIES) {
              console.error(`Failed after ${MAX_RETRIES} attempts for blocks ${fromBlock}-${toBlock}`);
              // Continue to next batch instead of throwing
              break;
            }
            
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          }
        }
  
        fromBlock = toBlock + 1;
      }
  
      // Filter campaigns by owner
      const userCampaigns = allEvents.filter(
        event => event.args.owner.toLowerCase() === walletAddress.toLowerCase()
      );
  
      if (userCampaigns.length === 0) {
        setCampaigns([]);
        return;
      }
  
      // Get campaign details in parallel with concurrency limit
      const CONCURRENCY_LIMIT = 5;
      const batches = [];
      for (let i = 0; i < userCampaigns.length; i += CONCURRENCY_LIMIT) {
        batches.push(userCampaigns.slice(i, i + CONCURRENCY_LIMIT));
      }
  
      const formattedCampaigns = [];
      for (const batch of batches) {
        const results = await Promise.all(
          batch.map(async (event) => {
            try {
              const campaignContract = new ethers.Contract(
                event.args.campaddress,
                camp.abi,
                provider
              );
  
              const [title, image, category, timestamp, requiredAmount, receivedAmount] = 
                await Promise.all([
                  campaignContract.Title(),
                  campaignContract.Image(),
                  campaignContract.category(),
                  campaignContract.timestamp(),
                  campaignContract.RequiredAmount(),
                  campaignContract.ReceivedAmount()
                ]);
  
              return {
                address: event.args.campaddress,
                title: title || "Untitled Campaign",
                image,
                category,
                timestamp: new Date(Number(timestamp) * 1000).toLocaleDateString(),
                goal: ethers.formatEther(requiredAmount),
                raised: ethers.formatEther(receivedAmount)
              };
            } catch (err) {
              console.error(`Error fetching details for ${event.args.campaddress}:`, err);
              return null;
            }
          })
        );
  
        formattedCampaigns.push(...results.filter(Boolean));
      }
  
      setCampaigns(formattedCampaigns);
      
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
      setError(formatRpcError(err));
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to format RPC errors
  const formatRpcError = (err) => {
    if (err.code === 'NETWORK_ERROR') {
      return "Network error - please check your connection";
    }
    if (err.code === 'SERVER_ERROR') {
      return "Server error - please try again later";
    }
    if (err.message?.includes('eth_getLogs')) {
      return "Failed to load campaign history - too many blocks requested";
    }
    return err.message || "Unknown error occurred";
  };

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnectedWallet = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setConnectedAddress(accounts[0]);
          fetchUserCampaigns(accounts[0]);
        }
      }
    };

    checkConnectedWallet();
  }, []);

  if (!connectedAddress) {
    return (
      <DashboardWrapper>
        <h1>Your Campaigns</h1>
        <ConnectButton onClick={connectWallet}>
          Connect Wallet to View Your Campaigns
        </ConnectButton>
      </DashboardWrapper>
    );
  }

  if (loading) {
    return <LoadingMessage>Loading your campaigns...</LoadingMessage>;
  }

  if (error) {
    return <ErrorMessage>Error: {error}</ErrorMessage>;
  }

  return (
    <DashboardWrapper>
      <h1>Your Campaigns ({connectedAddress.slice(0, 6)}...)</h1>
      
      {campaigns.length === 0 ? (
        <EmptyMessage>You haven't created any campaigns yet</EmptyMessage>
      ) : (
        <CampaignList>
          {campaigns.map((campaign) => (
            <CampaignItem key={campaign.address}>
              <CampaignLink href={`/campaign/${campaign.address}`}>
                <CampaignTitle>{campaign.title}</CampaignTitle>
                <CampaignDetails>
                  <div>Goal: {campaign.amount} ETH</div>
                  <div>Raised: {campaign.raised} ETH</div>
                  <div>Category: {campaign.category}</div>
                  <div>Created: {campaign.timestamp}</div>
                </CampaignDetails>
              </CampaignLink>
            </CampaignItem>
          ))}
        </CampaignList>
      )}
    </DashboardWrapper>
  );
}

// Styled components
const DashboardWrapper = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const ConnectButton = styled.button`
  padding: 1rem 2rem;
  background-color: #00b712;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.2rem;
  cursor: pointer;
  margin-top: 2rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #00990f;
  }
`;

const CampaignList = styled.ul`
  list-style: none;
  padding: 0;
  display: grid;
  gap: 1.5rem;
`;

const CampaignItem = styled.li`
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const CampaignLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: block;
  padding: 1.5rem;
`;

const CampaignTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.4rem;
`;

const CampaignDetails = styled.div`
  display: grid;
  gap: 0.5rem;
  color: #666;
`;

const LoadingMessage = styled.p`
  text-align: center;
  padding: 2rem;
`;

const ErrorMessage = styled.p`
  text-align: center;
  padding: 2rem;
  color: #d32f2f;
`;

const EmptyMessage = styled.p`
  text-align: center;
  padding: 2rem;
  color: #666;
`;