"use client";

import styled from "styled-components";
import { useEffect, useState } from "react";
import camp from "../../artifacts/contracts/lock.sol/camp.json";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import PaidIcon from "@mui/icons-material/Paid";
import EventIcon from "@mui/icons-material/Event";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Button, LinearProgress, Snackbar, Alert } from "@mui/material";
import { ethers } from "ethers";
import Pro from "../../artifacts/contracts/lock.sol/Pro.json";
import ShareIcon from "@mui/icons-material/Share";

export default function Index() {
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showModal, setShowModal] = useState(false);
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
          const batchSize = 40000;
          let fromBlock = deploymentBlock;
          let toBlock = Math.min(fromBlock + batchSize - 1, latestBlock);
          let allEvents = [];
  
          while (fromBlock <= latestBlock) {
            console.log(`Fetching events from block ${fromBlock} to ${toBlock}...`);
            const events = await contract.queryFilter(contract.filters.campcreated(), fromBlock, toBlock);
            allEvents.push(...events);
            fromBlock = toBlock + 1;
            toBlock = Math.min(fromBlock + batchSize - 1, latestBlock);
          
          }
        
  
          const allCampaigns = await Promise.all(allEvents.map(async (e) => {
            let cid = e.args?.campImage;
            let formattedImage = cid && cid.startsWith("Qm") ? `${ipfsGateway}${cid}` : null;
  
            const campaignContract = new ethers.Contract(
                e.args.campaddress,
                Pro.abi,
                provider
              );
            let description1, description2, receivedAmount;
  
            try {
              description2 = await campaignContract.Story();
              description1 = `${ipfsGateway}${description2}`;
              receivedAmount = await campaignContract.ReceivedAmount();
  
              const response = await fetch(description1);
              if (response.ok) {
                description1 = await response.text();
              } else {
                throw new Error("Failed to fetch IPFS content");
              }
            } catch {
              description1 = "Failed to fetch story";
              receivedAmount = 0;
            }
            const donations = await fetchDonations(e.args.campaddress);
            if (donations.length > 0) {
              donations.sort((a, b) => b.timestamp - a.timestamp);
            }
            return {
              title: e.args?.Title || "No Title Available",
              img: formattedImage,
              owner: e.args?.owner || "Unknown",
              timestamp: Number(e.args?.timestamp) || 0,
              requiredAmount: ethers.formatEther(e.args?.RequiredAmount || "0"),
              category: e.args?.category || "General",
              campaignAddress: e.args?.campaddress,
              description: description1,
              currentAmount: ethers.formatEther(receivedAmount),
              donations: donations || [],
            };
          }));
  
          let userAddress = null;
          if (window.ethereum) {
            const providerMeta = new ethers.BrowserProvider(window.ethereum);
            const signer = await providerMeta.getSigner();
            userAddress = await signer.getAddress();
          }
  
          const sortedCampaigns = allCampaigns.sort((a, b) => b.timestamp - a.timestamp);
          const myCamps = sortedCampaigns.filter(
            (c) => userAddress && c.owner.toLowerCase() === userAddress.toLowerCase()
          );
  
          setCampaigns(sortedCampaigns);
          setFilteredCampaigns(myCamps);
          setLoading(false);
        } catch (err) {
          console.error("Error fetching campaigns:", err);
          setError(err.message);
          setLoading(false);
        }
      };
  
      fetchCampaigns();
    }, []);
    
    const fetchDonations = async (campaignAddress) => {
      try {
        const provider = new ethers.JsonRpcProvider(rpc);
        const campaignContract = new ethers.Contract(
          campaignAddress,
          Pro.abi,
          provider
        );
    
        // Get current block number
        const latestBlock = await provider.getBlockNumber();
        const batchSize = 50000; // Stay under RPC provider limits
        let fromBlock = 3400000; // Adjust this to your contract's deployment block
        let toBlock = Math.min(fromBlock + batchSize - 1, latestBlock);
        let allDonationEvents = [];
    
        // Paginate through blocks in batches
        while (fromBlock <= latestBlock) {
          console.log(`Fetching blocks ${fromBlock} to ${toBlock}`);
          
          const events = await campaignContract.queryFilter(
            campaignContract.filters.donated(),
            fromBlock,
            toBlock
          );
          
          allDonationEvents.push(...events);
          fromBlock = toBlock + 1;
          toBlock = Math.min(fromBlock + batchSize - 1, latestBlock);
        }
    
        return allDonationEvents.map(event => ({
          donor: event.args.donar,
          amount: ethers.formatEther(event.args.Amount),
          timestamp: Number(event.args.timestamp.toString()) 
        }));
      } catch (error) {
        console.error("Error fetching donations:", error);
        return [];
      }
    };
  
    const openCampaignDetails = (campaign) => {
      setSelectedCampaign(campaign);
      setShowModal(true);
    };
  
    const closeModal = () => {
      setShowModal(false);
      setSelectedCampaign(null);
    };
  
    const calculateProgress = () => {
      if (!selectedCampaign) return 0;
      const raised = parseFloat(selectedCampaign.currentAmount);
      const goal = parseFloat(selectedCampaign.requiredAmount);
      return Math.min((raised / goal) * 100, 100);
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
  
    const handleCloseSnackbar = () => {
      setSnackbar({ ...snackbar, open: false });
    };
  
    return (
      <HomeWrapper>
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
                    <img src={e.img} onError={(e) => (e.target.style.display = "none")} alt="Campaign" />
                  ) : (
                    <NoImagePlaceholder>No Image Available</NoImagePlaceholder>
                  )}
                </CardImg>
                <Title>{e.title}</Title>
                <CardData>
                  <Text>Owner <AccountBoxIcon /></Text>
                  <Text>{e.owner.slice(0, 6)}...{e.owner.slice(-4)}</Text>
                </CardData>
                <CardData>
                  <Text>Amount <PaidIcon /></Text>
                  <Text>{e.requiredAmount} ETH</Text>
                </CardData>
                <CardData>
                  <Text><EventIcon /></Text>
                  <Text>{new Date(e.timestamp * 1000).toLocaleDateString()}</Text>
                </CardData>
                <StyledButton onClick={() => openCampaignDetails(e)}>View Details</StyledButton>
              </Card>
            ))
          ) : (
            <NoCampaigns>No campaigns found.</NoCampaigns>
          )}
        </CardsWrapper>
        {showModal && selectedCampaign && (
  <ModalOverlay onClick={closeModal}>
    <RectangularModalContainer onClick={(e) => e.stopPropagation()}>
      <CloseButton onClick={closeModal}><CloseIcon /></CloseButton>
      
      <ModalGridLayout>
        {/* Left Column - Campaign Visuals */}
        <LeftColumn>
          <CampaignImage>
            {selectedCampaign.img ? (
              <img src={selectedCampaign.img} alt="Campaign" />
            ) : (
              <ImagePlaceholder>No Image Available</ImagePlaceholder>
            )}
          </CampaignImage>
          
          <CampaignDescription>
            <SectionTitle>About This Campaign</SectionTitle>
            <DescriptionText>{selectedCampaign.description}</DescriptionText>
          </CampaignDescription>
        </LeftColumn>

        {/* Right Column - Campaign Details */}
        <RightColumn>
        <ModalHeader>
              <ModalTitle>{selectedCampaign.title}</ModalTitle>
            <ModalheaderCategory>
              <ModalCategory>{selectedCampaign.category}</ModalCategory>
              <ShareButton onClick={shareCampaign}>
                <ShareIcon /> Share
              </ShareButton>
            </ModalheaderCategory>
            </ModalHeader>

          <ProgressContainer>
            <ProgressBarWrapper>
              <StyledProgress variant="determinate" value={calculateProgress()} />
              <ProgressText>
                {calculateProgress().toFixed(1)}% funded ({selectedCampaign.currentAmount} ETH / {selectedCampaign.requiredAmount} ETH)
              </ProgressText>
            </ProgressBarWrapper>
          </ProgressContainer>

          <DetailsContainer>
            <DetailItem>
              <DetailLabel>Owner</DetailLabel>
              <DetailValue>
                {(selectedCampaign.owner)}
                <CopyButton onClick={() => copyToClipboard(selectedCampaign.owner)}>
                  <ContentCopyIcon fontSize="small" />
                </CopyButton>
              </DetailValue>
            </DetailItem>

            <DetailItem>
              <DetailLabel>Campaign ID</DetailLabel>
              <DetailValue>
                {(selectedCampaign.campaignAddress)}
                <CopyButton onClick={() => copyToClipboard(selectedCampaign.campaignAddress)}>
                  <ContentCopyIcon fontSize="small" />
                </CopyButton>
              </DetailValue>
            </DetailItem>

            <DetailItem>
              <DetailLabel>Created</DetailLabel>
              <DetailValue>
                {new Date(selectedCampaign.timestamp * 1000).toLocaleDateString()}
              </DetailValue>
            </DetailItem>
          </DetailsContainer>

          <DonationsSection>
  <SectionTitle>Recent Donations</SectionTitle>
  <DonationsTable>
    <TableHeader>
      <TableHeaderCell>Donor</TableHeaderCell>
      <TableHeaderCell>Amount</TableHeaderCell>
      <TableHeaderCell>Date</TableHeaderCell>
      <TableHeaderCell>Time</TableHeaderCell>
    </TableHeader>
    <TableBody>
      {selectedCampaign.donations?.length > 0 ? (
        selectedCampaign.donations
          .sort((a, b) => b.timestamp - a.timestamp)
          .map((donation, index) => (
            <TableRow key={index}>
              {/* Donor Column */}
              <TableCell>
                <DonorWrapper>
                  {`${donation.donor.slice(0, 6)}...${donation.donor.slice(-4)}`}
                  <CopyButton onClick={() => copyToClipboard(donation.donor)}>
                    <ContentCopyIcon fontSize="small" />
                  </CopyButton>
                </DonorWrapper>
              </TableCell>
              
              {/* Amount Column */}
              <TableCell>
                <EthAmount>{parseFloat(donation.amount).toFixed(4)} ETH</EthAmount>
              </TableCell>
              
              {/* Date Column */}
              <TableCell>
                {new Date(donation.timestamp * 1000).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </TableCell>
              
              {/* Time Column - Now completely separate */}
              <TableCell>
                {new Date(donation.timestamp * 1000).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </TableCell>
            </TableRow>
          ))
      ) : (
        <TableRow>
          <TableCell colSpan={4} style={{ textAlign: 'center' }}>
            No donations yet
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </DonationsTable>
</DonationsSection>
        </RightColumn>
      </ModalGridLayout>
    </RectangularModalContainer>
  </ModalOverlay>
)}
  
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </HomeWrapper>
    );
  };

// New Styled Components

const ShareButton= styled.button`
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
  border-radius: 20px;
  border: 1px solid #ddd;
  gap: 6px;
  display: flex;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
`;
const DonationsTable = styled.div`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1.8fr 1fr 1fr 1fr; /* Adjusted column widths */
  background-color: #f8fafc;
  padding: 12px 16px;
  font-weight: 600;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
`;

const TableBody = styled.div`
  display: grid;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1.8fr 1fr 1fr 1fr; /* Must match header */
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  align-items: center;

  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.div`
  padding: 8px 12px;
  font-size: 14px;
  color: #334155;
  white-space: nowrap;
`;

const EthAmount = styled.span`
  font-family: 'Roboto Mono', monospace;
  color: #10b981;
  font-weight: 500;
`;

const DonorWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  padding: 4px;
  display: flex;
  align-items: center;
  &:hover {
    color: #334155;
  }
`;


const RectangularModalContainer = styled.div`
  background-color: white;
  border-radius: 12px;
  width: 92%;
  width: 1500px;    
  height: 100vh;     
  overflow-y: auto;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  border: 1px solid #f0f0f0;
  background-color: ${(props) => props.theme.bgDiv};
  color: ${(props) => props.theme.color};
  
  /* Subtle border animation on hover */
  transition: all 0.3s ease;
  &:hover {
    box-shadow: 0 10px 36px rgba(0, 0, 0, 0.15);
    border-color: #e0e0e0;
  }

  /* Responsive adjustments */
  @media (max-width: 900px) {
    min-width: 90%;
    max-width: 95%;
    min-height: auto;
  }
`;

const ModalGridLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 30px;
  padding: 30px;
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
`;

const CampaignImage = styled.div`
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

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
`;

const CampaignDescription = styled.div`
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
`;

const DescriptionText = styled.p`
  margin: 0;
  line-height: 1.6;
  color: #333;
`;

const ProgressContainer = styled.div`
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
`;

const ProgressBarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
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

const ProgressText = styled.div`
  font-size: 14px;
  color: #666;
  text-align: center;
`;

const DetailsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DetailLabel = styled.div`
  font-weight: 600;
  color: #555;
`;

const DetailValue = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: monospace;
  color: #333;
`;

const DonationsSection = styled.div`
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
`;



const TableHeaderCell = styled.div`
  text-align: left;
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



const CloseButton = styled.button`
  position: absolute;
  top: 6px;
  right: 6px;
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
`;
const ModalheaderCategory = styled.div`
  display: flex; 
   align-items: center;
  margin-bottom: 20px;
  gap: 10px;
  color: #666;
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


const SectionTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 18px;
  color: #444;
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