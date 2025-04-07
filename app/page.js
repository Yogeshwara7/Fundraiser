"use client";

import styled from "styled-components";
import { useEffect, useState } from "react";
import camp from "../artifacts/contracts/lock.sol/camp.json";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import PaidIcon from "@mui/icons-material/Paid";
import EventIcon from "@mui/icons-material/Event";
import CloseIcon from "@mui/icons-material/Close";
import ShareIcon from "@mui/icons-material/Share";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Button, LinearProgress, Snackbar, Alert } from "@mui/material";
import { ethers } from "ethers";
import Pro from "../artifacts/contracts/lock.sol/Pro.json";

export default function Index() {
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");
  const [isDonating, setIsDonating] = useState(false);
  const [totalReceived, setTotalReceived] = useState("0");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const ipfsGateway = "https://black-high-hyena-919.mypinata.cloud/ipfs/";
  const rpc = "https://ethereum-holesky-rpc.publicnode.com";
  const contractaddress = "0xe83f5ed750f4617EE09Ef2dd0036220eaCEAF99a";

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(rpc);
        const contract = new ethers.Contract(contractaddress, camp.abi, provider);

        const latestBlock = await provider.getBlockNumber();
        const deploymentBlock = 3400000;
        const batchSize = 50000;
        let fromBlock = deploymentBlock;
        let toBlock = Math.min(fromBlock + batchSize - 1, latestBlock);
        let allEvents = [];
        console.log("Latest Block:", latestBlock);

        while (fromBlock <= latestBlock) {
          const events = await contract.queryFilter(contract.filters.campcreated(), fromBlock, toBlock);
          allEvents.push(...events);
          fromBlock = toBlock + 1;
          toBlock = Math.min(fromBlock + batchSize - 1, latestBlock);
          console.log("Fetched events from block", fromBlock, "to", toBlock);
        }

        const allCampaigns = await Promise.all(allEvents.map(async (e) => {
          let cid = e.args?.campImage;
          let formattedImage = cid && cid.startsWith("Qm") ? `${ipfsGateway}${cid}` : null;
        
          // Fetch additional campaign details
          const campaignContract = new ethers.Contract(
            e.args.campaddress,
            Pro.abi,
            provider
          );
          console.log("Story IPFS Hash:", e.args?.Story);
          let description1, description2, receivedAmount;
          try {
            // Fetch the story directly from the Pro contract
            description2 = await campaignContract.Story();
            // Fetch the IPFS URL for the story 
            description1 = `${ipfsGateway}${description2}`;
  
            // Fetch the current amount (ReceivedAmount) from the Pro contract
            receivedAmount = await campaignContract.ReceivedAmount();

            // Fetch plain text from IPFS
            const response = await fetch(description1);
            if (response.ok) {
              description1 = await response.text(); // Replace IPFS link with actual text
            } else {
              throw new Error("Failed to fetch IPFS content");
            }
          } catch (err) {
            console.error("Error fetching additional details for campaign:", e.args.campaddress, err);
            description1 = "Failed to fetch story";
            receivedAmount = 0;
          }
          return {
            title: e.args?.Title || "No Title Available",
            img: formattedImage,
            owner: e.args?.owner || "Unknown",
            timestamp: Number(e.args?.timestamp) || 0,
            requiredAmount: ethers.formatEther(e.args?.RequiredAmount || "0"), // Convert to ETH
            category: e.args?.category || "General",
            campaignAddress: e.args?.campaddress,
            description: description1 || "No description available",
            currentAmount: ethers.formatEther(receivedAmount), // Convert to ETH
          };
        }),);

        const sortedCampaigns = allCampaigns.sort((a, b) => b.timestamp - a.timestamp);
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


  const filterCampaigns = (category) => {
    if (category === "All") setFilteredCampaigns(campaigns);
    else setFilteredCampaigns(campaigns.filter((e) => e.category === category));
  };

  const openCampaignDetails = (campaign) => {
    setSelectedCampaign(campaign);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCampaign(null);
    setDonationAmount("");
  };

  const handleDonate = async () => {
    if (!donationAmount || isNaN(donationAmount) || Number(donationAmount) <= 0) {
      setSnackbar({
        open: true,
        message: "Please enter a valid donation amount (minimum 0.001 ETH)",
        severity: "error",
      });
      return;
    }
  
    try {
      setIsDonating(true);
      
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to donate");
      }
  
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found - please connect your wallet");
      }
  
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
  
      // Create contract instance with signer
      const campaignContract = new ethers.Contract(
        selectedCampaign.campaignAddress, // Use the campaign's address
        Pro.abi, // Use the Pro.json ABI
        signer
      );
  
      // Convert ETH amount to Wei
      const amountWei = ethers.parseEther(donationAmount);
      const tx = await campaignContract.donate({
        value: amountWei,
        gasLimit: 300000 // Increased gas limit
      });
      // Send transaction
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Show success message
      setSnackbar({
        open: true,
        message: `Donation of ${donationAmount} ETH successful!`,
        severity: "success",
      });
  
      // Refresh campaign data
      const updatedAmount = await campaignContract.ReceivedAmount();
      const formattedAmount = ethers.formatEther(updatedAmount);
      
      setSelectedCampaign({
        ...selectedCampaign,
        currentAmount: formattedAmount,
      });
  
    } catch (err) {
      console.error("Donation failed:", err);
      
      let errorMessage = "Donation failed";
      if (err.message.includes("user rejected transaction")) {
        errorMessage = "Transaction was rejected";
      } else if (err.message.includes("insufficient funds")) {
        errorMessage = "Insufficient balance for donation";
      } else if (err.message.includes("execution reverted")) {
        errorMessage = "Contract rejected the donation";
      } else {
        errorMessage = err.message;
      }
  
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setIsDonating(false);
    }
  };
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSnackbar({
      open: true,
      message: "Copied to clipboard!",
      severity: "success",
    });
  };

  const shareCampaign = () => {
    if (navigator.share) {
      navigator.share({
        title: selectedCampaign.title,
        text: `Check out this campaign: ${selectedCampaign.title}`,
        url: window.location.href,
      }).catch(err => {
        console.log('Error sharing:', err);
      });
    } else {
      copyToClipboard(window.location.href);
    }
  };

  const calculateProgress = () => {
    if (!selectedCampaign) return 0;
    const raised = parseFloat(selectedCampaign.currentAmount);
    const goal = parseFloat(selectedCampaign.requiredAmount);
    return Math.min((raised / goal) * 100, 100);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <HomeWrapper>
      <FilterWrapper>
        <FilterAltIcon style={{ fontSize: 40 }} />
        {["All", "Education", "Health", "Gaming", "Animal", "Social Media", "Music"].map((category) => (
          <Category key={category} onClick={() => filterCampaigns(category)}>
            {category}
          </Category>
        ))}
      </FilterWrapper>

      <CardsWrapper>
        {loading ? (
          <LoadingSpinner>Loading campaigns...</LoadingSpinner>
        ) : error ? (
          <ErrorMessage>Error: {error}</ErrorMessage>
        ) : filteredCampaigns.length > 0 ? (
          filteredCampaigns.map((e, index) => (
            <Card key={index}>
              <CardImg>
                {e.img ? (
                  <img
                    src={e.img}
                    onError={(event) => {
                      event.target.style.display = "none";
                    }}
                    alt="Campaign Image"
                  />
                ) : (
                  <NoImagePlaceholder>
                    No Image Available
                  </NoImagePlaceholder>
                )}
              </CardImg>
              <Title>{e.title}</Title>
              <CardData>
                <Text>Owner <AccountBoxIcon /></Text>
                <Text>{e.owner.slice(0, 6)}...{e.owner.slice(-4)}</Text>
              </CardData>
              <CardData>
                <Text>Amount <PaidIcon /></Text>
                <Text>{isNaN(e.requiredAmount) ? "N/A" : e.requiredAmount} ETH</Text>
              </CardData>
              <CardData>
                <Text><EventIcon /></Text>
                <Text>
                  {isNaN(e.timestamp)
                    ? "Invalid Date"
                    : new Date(e.timestamp * 1000).toLocaleDateString()}
                </Text>
              </CardData>
              <StyledButton onClick={() => openCampaignDetails(e)}>
                View Details
              </StyledButton>
            </Card>
          ))
        ) : (
          <NoCampaigns>No campaigns match your filters.</NoCampaigns>
        )}
      </CardsWrapper>

      {/* Campaign Details Modal */}
      {showModal && selectedCampaign && (
        <ModalOverlay onClick={closeModal}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={closeModal}>
              <CloseIcon />
            </CloseButton>
            
            <ModalHeader>
              <ModalTitle>{selectedCampaign.title}</ModalTitle>
              <ModalheaderCategory>
              <ModalCategory>{selectedCampaign.category}</ModalCategory>
              <ShareButton onClick={shareCampaign}>
                <ShareIcon /> Share
                
              </ShareButton>
              </ModalheaderCategory>
            </ModalHeader>
            
            <ModalImage>
              {selectedCampaign.img ? (
                <img
                  src={selectedCampaign.img}
                  alt="Campaign"
                />
              ) : (
                <NoImagePlaceholder>
                  No Image Available
                </NoImagePlaceholder>
              )}
            </ModalImage>
            
            <ProgressContainer>
              <ProgressText>
                Raised: {selectedCampaign.currentAmount} ETH / {selectedCampaign.requiredAmount} ETH
              </ProgressText>
              <StyledProgress 
                variant="determinate" 
                value={calculateProgress()} 
              />
              <ProgressPercentage>
                {calculateProgress().toFixed(1)}% funded
              </ProgressPercentage>
            </ProgressContainer>
            
            <ModalSection>
              <SectionTitle>Description</SectionTitle>
              <SectionContent>{selectedCampaign.description}</SectionContent>
            </ModalSection>
            
            <ModalGrid>
              <InfoBox>
                <InfoLabel>Owner Address</InfoLabel>
                <InfoValueWithCopy>
                  {selectedCampaign.owner.slice(0, 6)}...{selectedCampaign.owner.slice(-4)}
                  <CopyButton onClick={() => copyToClipboard(selectedCampaign.owner)}>
                    <ContentCopyIcon fontSize="small" />
                  </CopyButton>
                </InfoValueWithCopy>
              </InfoBox>
              
              <InfoBox>
                <InfoLabel>Campaign Address</InfoLabel>
                <InfoValueWithCopy>
                  {selectedCampaign.campaignAddress.slice(0, 6)}...{selectedCampaign.campaignAddress.slice(-4)}
                  <CopyButton onClick={() => copyToClipboard(selectedCampaign.campaignAddress)}>
                    <ContentCopyIcon fontSize="small" />
                  </CopyButton>
                </InfoValueWithCopy>
              </InfoBox>
              
              <InfoBox>
                <InfoLabel>Created</InfoLabel>
                <InfoValue>
                  {new Date(selectedCampaign.timestamp * 1000).toLocaleString()}
                </InfoValue>
              </InfoBox>
            
            </ModalGrid>
            
            <DonationSection>
              <SectionTitle>Support This Campaign</SectionTitle>
              <DonationInput
                type="number"
                placeholder="Amount in ETH"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                min="0.001"
                step="0.001"
              />
              <DonateButton 
                variant="contained" 
                onClick={handleDonate}
                disabled={isDonating}
              >
                {isDonating ? "Processing..." : "Donate Now"}
              </DonateButton>
              <DonationNote>
                Minimum donation: 0.001 ETH
              </DonationNote>
            </DonationSection>
          </ModalContainer>
        </ModalOverlay>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </HomeWrapper>
  );
}

// New Styled Components
const ShareButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 6px 12px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;

  &:hover {
    background-color: #f5f5f5;
    border-color: #ccc;
  }
`;
const ModalCategory = styled.span`
  background-color: #f0f0f0;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
`;

const ProgressContainer = styled.div`
  margin: 20px 0;
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
`;

const StyledProgress = styled(LinearProgress)`
  && {
    height: 10px;
    border-radius: 5px;
    background-color: #f0f0f0;
    
    .MuiLinearProgress-bar {
      border-radius: 5px;
      background-color: #00b712;
    }
  }
`;

const ProgressPercentage = styled.div`
  text-align: right;
  margin-top: 4px;
  font-size: 14px;
  color: #00b712;
  font-weight: bold;
`;

const InfoValueWithCopy = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  font-size: 16px;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 4px;
  display: flex;
  align-items: center;

  &:hover {
    color: #333;
  }
`;

const DonationInput = styled.input`
  width: 100%;
  padding: 12px;
  margin: 12px 0;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #00b712;
  }
`;

const DonationNote = styled.div`
  font-size: 14px;
  color: #666;
  margin-top: 8px;
`;

// Updated existing styled components
const CardImg = styled.div`
  position: relative;
  height: 200px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ModalImage = styled.div`
 width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden ;
  align -items: center;
  align  -content: center;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }
`;

const DonateButton = styled(Button)`
  && {
    background-color: #00b712;
    color: white;
    padding: 12px 24px;
    font-weight: bold;
    width: 100%;
    margin-top: 12px;
    
    &:hover {
      background-color: #00990f;
    }
    
    &:disabled {
      background-color: #cccccc;
    }
  }
`;

// New Styled Components for Modal
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 1px;
  gap: 6px;
  display: flex;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  font-size: 24px;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px;  
`;

const ModalheaderCategory = styled.span`
display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 6px;
  `;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 24px;
  color: #333;
`;




const ModalSection = styled.div`
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const DonationSection = styled(ModalSection)`
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 18px;
  color: #444;
`;

const SectionContent = styled.p`
  margin: 0;
  line-height: 1.6;
  color: #666;
`;

const ModalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const InfoBox = styled.div`
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
`;

const InfoLabel = styled.div`
  font-size: 14px;
  color: #888;
  margin-bottom: 8px;
`;

const InfoValue = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #333;
  word-break: break-all;
`;



// Updated existing styled components
const NoImagePlaceholder = styled.div`
  width: 100%;
  height: 200px;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 16px;
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #d32f2f;
`;

const NoCampaigns = styled.div`
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
`;

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