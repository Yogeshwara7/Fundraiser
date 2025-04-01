"use client";
import styled from "styled-components";
import Image from "next/image";
import { ethers } from "ethers";
import pro from "../../../artifacts/contracts/lock.sol/Pro.json";
import { useEffect, useState } from "react";
import { use } from "react";

export default function Detail({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const [data, setData] = useState(null);
  const [donationsData, setDonationsData] = useState([]);
  const [imageSrc, setImageSrc] = useState("");
  const [story, setStory] = useState("");
  const [amount, setAmount] = useState("");
  const [isCreator, setIsCreator] = useState(false);
  const [change, setChange] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      try {
        console.log("Fetching campaign details...");

        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        console.log("RPC URL:", process.env.NEXT_PUBLIC_RPC_URL);

        const contract = new ethers.Contract(params.address, pro.abi, provider);
        console.log("Contract Address:", params.address);
        console.log("Contract Instance:", contract);

        const [title, requiredAmount, receivedAmount, image, storyUrl, owner] = await Promise.all([
          contract.Title(),
          contract.RequiredAmount(),
          contract.ReceivedAmount(),
          contract.Image(),
          contract.Story(),
          contract.owner(),
        ]);
        console.log("Fetched Campaign Data:", { title, requiredAmount, receivedAmount, image, storyUrl, owner });

        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          console.log("Connected Account:", accounts[0]);
          setIsCreator(accounts[0].toLowerCase() === owner.toLowerCase());
        }

        setData({
          title,
          requiredAmount: ethers.formatEther(requiredAmount),
          receivedAmount: ethers.formatEther(receivedAmount),
          image,
          storyUrl,
          owner,
        });

        const donationsFilter = contract.filters.donated();
        const allDonations = await contract.queryFilter(donationsFilter);
        console.log("All Donations:", allDonations);

        const donations = allDonations.map((e) => ({
          donar: `${e.args.donar.slice(0, 6)}...${e.args.donar.slice(-4)}`,
          amount: ethers.formatEther(e.args.amount?.toString() || "0"),
          timestamp: parseInt(e.args.timestamp?.toString() || "0"),
        }));
        console.log("Mapped Donations:", donations);

        setDonationsData(donations);

        if (storyUrl) {
          const res = await fetch(`https://black-high-hyena-919.mypinata.cloud/ipfs/${storyUrl}`);
          console.log("Story Fetch Response:", res);
          if (res.ok) setStory(await res.text());
        }

        if (image) {
          const res = await fetch(`https://black-high-hyena-919.mypinata.cloud/ipfs/${image}`);
          console.log("Image Fetch Response:", res);
          if (res.ok) setImageSrc(URL.createObjectURL(await res.blob()));
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      }
    };

    fetchCampaignDetails();
  }, [params.address, change]);

  const DonateFunds = async () => {
    if (!amount || !window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(params.address, pro.abi, signer);

      const tx = await contract.donate({ value: ethers.parseEther(amount) });
      await tx.wait();
      setChange(!change); // Refresh data
      setAmount(""); // Reset input
    } catch (error) {
      console.error("Donation failed:", error);
      setError(error.message);
    }
  };

  if (error) return <ErrorDisplay>Error: {error}</ErrorDisplay>;
  if (!data) return <Loading>Loading...</Loading>;

  return (
    <DetailWrapper>
      <LeftContainer>
        <ImageSection>
          {imageSrc ? (
            <Image alt="Campaign Image" layout="fill" src={imageSrc} />
          ) : (
            <p>Loading image...</p>
          )}
        </ImageSection>
        <Text>{story}</Text>
      </LeftContainer>
      <RightContainer>
        <Title>{data.title}</Title>
        <FundsData>
          <Funds>
            <FundText>Required Amount</FundText>
            <FundText>{data.requiredAmount} ETH</FundText>
          </Funds>
          <Funds>
            <FundText>Received Amount</FundText>
            <FundText>{data.receivedAmount} ETH</FundText>
          </Funds>
        </FundsData>
        {!isCreator && (
          <DonateSection>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              placeholder="Enter Amount To Donate"
            />
            <Donate onClick={DonateFunds} disabled={!data.address || !amount}>
              Donate
            </Donate>
          </DonateSection>
        )}
        <Donated>
          <LiveDonation>
            <DonationTitle>Recent Donations</DonationTitle>
            {donationsData.map((e) => (
              <Donation key={e.timestamp}>
                <DonationData>{e.donar}</DonationData>
                <DonationData>{e.amount} ETH</DonationData>
                <DonationData>
                  {new Date(e.timestamp * 1000).toLocaleString()}
                </DonationData>
              </Donation>
            ))}
          </LiveDonation>
        </Donated>
      </RightContainer>
    </DetailWrapper>
  );
}

// Styled components remain unchanged

// Styled components remain unchanged

// Styled components remain unchanged

// Styled components remain unchanged
// Styled components remain unchanged
// Styled components remain unchanged

// Styled components remain unchanged

// Styled components remain unchangednts remain unchanged
const ErrorDisplay = styled.p`
  color: red;
  padding: 20px;
  text-align: center;
`;

const Loading = styled.p`
  color: ${(props) => props.theme.color};
  padding: 20px;
  text-align: center;
`;

const DetailWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 20px;
  width: 98%;
`;
const LeftContainer = styled.div`
  width: 45%;
`;
const RightContainer = styled.div`
  width: 50%;
`;
const ImageSection = styled.div`
  width: 100%;
  position: relative;
  height: 350px;
`;
const Text = styled.p`
  font-family: "Roboto";
  font-size: large;
  color: ${(props) => props.theme.color};
  text-align: justify;
`;
const Title = styled.h1`
  padding: 0;
  margin: 0;
  font-family: "Poppins";
  font-size: x-large;
  color: ${(props) => props.theme.color};
`;
const DonateSection = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
`;
const Input = styled.input`
  padding: 8px 15px;
  background-color: ${(props) => props.theme.bgDiv};
  color: ${(props) => props.theme.color};
  border: none;
  border-radius: 8px;
  outline: none;
  font-size: large;
  width: 40%;
  height: 40px;
`;
const Donate = styled.button`
  display: flex;
  justify-content: center;
  width: 40%;
  padding: 15px;
  color: white;
  background-color: #00b712;
  background-image: linear-gradient(180deg, #00b712 0%, #5aff15 80%);
  border: none;
  cursor: pointer;
  font-weight: bold;
  border-radius: 8px;
  font-size: large;
`;
const FundsData = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
`;
const Funds = styled.div`
  width: 45%;
  background-color: ${(props) => props.theme.bgDiv};
  padding: 8px;
  border-radius: 8px;
  text-align: center;
`;
const FundText = styled.p`
  margin: 2px;
  padding: 0;
  font-family: "Poppins";
  font-size: normal;
`;
const Donated = styled.div`
  height: 280px;
  margin-top: 15px;
  background-color: ${(props) => props.theme.bgDiv};
`;
const LiveDonation = styled.div`
  height: 65%;
  overflow-y: auto;
`;
const MyDonation = styled.div`
  height: 35%;
  overflow-y: auto;
`;
const DonationTitle = styled.div`
  font-family: "Roboto";
  font-size: x-small;
  text-transform: uppercase;
  padding: 4px;
  text-align: center;
  background-color: #4cd137;
`;
const Donation = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  background-color: ${(props) => props.theme.bgSubDiv};
  padding: 4px 8px;
`;
const DonationData = styled.p`
  color: ${(props) => props.theme.color};
  font-family: "Roboto";
  font-size: large;
  margin: 0;
  padding: 0;
`;