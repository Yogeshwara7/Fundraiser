"use client";
import styled from "styled-components";
import Image from "next/image";
import { ethers } from "ethers";
import camp from "../../artifacts/contracts/lock.sol/camp.json";
import Pro from "../../artifacts/contracts/lock.sol/Pro.json";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function Detail({ Data, DonationsData }) {
  const [mydonations, setMydonations] = useState([]);
  const [imageSrc, setImageSrc] = useState("");
  const [story, setStory] = useState("");
  const [amount, setAmount] = useState("");
  const [change, setChange] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Check if Data is defined before proceeding
      if (!Data) {
        console.error("Data is undefined");
        return; // Exit if Data is not available
      }

      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const Web3provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await Web3provider.getSigner();
        const Address = await signer.getAddress();

        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const contract = new ethers.Contract(Data.address, camp.abi, provider);

        // Fetch story text from IPFS
        const response = await fetch(`https://black-high-hyena-919.mypinata.cloud/ipfs/${Data.storyUrl}`);
        const storyData = await response.text();
        setStory(storyData);

        // Fetch user's donations
        const myDonationsFilter = contract.filters.donated(Address);
        const myDonationsEvents = await contract.queryFilter(myDonationsFilter);

        setMydonations(
          myDonationsEvents.map((e) => ({
            donar: e.args.donar,
            amount: ethers.formatEther(e.args.amount),
            timestamp: Number(e.args.timestamp),
          }))
        );

        // Fetch image from IPFS
        const imageResponse = await fetch(`https://black-high-hyena-919.mypinata.cloud/ipfs/${Data.image}`);
        if (!imageResponse.ok) throw new Error("Failed to fetch image");

        const imageBlob = await imageResponse.blob();
        setImageSrc(URL.createObjectURL(imageBlob));
      } catch (error) {
        console.error("Error fetching data:", error);
        setImageSrc("/fallback-image.jpg"); // Use fallback image if error occurs
      }
    };

    fetchData();
  }, [Data, change]); // Add Data to the dependency array

  const DonateFunds = async () => {
    try {
      if (!amount || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Use Pro.abi instead of camp.abi since we're interacting with the Pro contract
      const contract = new ethers.Contract(Data.address, Pro.abi, signer);

      const transaction = await contract.donate({
        value: ethers.parseEther(amount),
        gasLimit: 100000 // Add explicit gas limit
      });

      // Show pending transaction notification
      toast.info("Transaction submitted! Waiting for confirmation...");

      await transaction.wait();
      setChange(true);
      setAmount("");
      toast.success("Donation successful!");
    } catch (error) {
      console.error("Error donating:", error);
      let errorMessage = "Failed to donate. ";
      
      if (error.message.includes("user rejected")) {
        errorMessage += "Transaction was rejected.";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage += "Insufficient funds for transaction.";
      } else if (error.message.includes("Required Amount has been fulfilled")) {
        errorMessage += "This campaign has already reached its goal!";
      } else {
        errorMessage += error.message || "Please try again.";
      }
      
      toast.error(errorMessage);
    }
  };

  // Check if Data is available before rendering
  if (!Data) {
    return <p>Loading...</p>; // Show loading state while data is being fetched
  }

  return (
    <DetailWrapper>
      <LeftContainer>
        <ImageSection>
          {imageSrc ? (
            <Image alt="crowdfunding dapp" layout="fill" src={imageSrc} />
          ) : (
            <p>Loading image...</p>
          )}
        </ImageSection>
        <Text>{story}</Text>
      </LeftContainer>
      <RightContainer>
        <Title>{Data.title}</Title>
        <DonateSection>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            placeholder="Enter Amount To Donate"
          />
          <Donate onClick={DonateFunds}>Donate</Donate>
        </DonateSection>
        <FundsData>
          <Funds>
            <FundText>Required Amount</FundText>
            <FundText>{Data.requiredAmount} MATIC</FundText>
          </Funds>
          <Funds>
            <FundText>Received Amount</FundText>
            <FundText>{Data.receivedAmount} MATIC</FundText>
          </Funds>
        </FundsData>
        <Donated>
          <LiveDonation>
            <DonationTitle>Recent Donations</DonationTitle>
            {/* Uncomment and implement this section as needed */}
            {/* {DonationsData.map((e) => (
              <Donation key={e.timestamp}>
                <DonationData>
                  {e.donar.slice(0, 6)}...{e.donar.slice(39)}
                </DonationData>
                <DonationData>{e.amount} MATIC</DonationData>
                <DonationData>
                  {new Date(e.timestamp * 1000).toLocaleString()}
                </DonationData>
              </Donation>
            ))} */}
          </LiveDonation>
          <MyDonation>
            <DonationTitle>My Past Donations</DonationTitle>
            {/* Uncomment and implement this section as needed */}
            {/* {mydonations.map((e) => (
              <Donation key={e.timestamp}>
                <DonationData>
                  {e.donar.slice(0, 6)}...{e.donar.slice(39)}
                </DonationData>
                <DonationData>{e.amount} MATIC</DonationData>
                <DonationData>
                  {new Date(e.timestamp * 1000).toLocaleString()}
                </DonationData>
              </Donation>
            ))} */}
          </MyDonation>
        </Donated>
      </RightContainer>
    </DetailWrapper>
  );
}

export async function getStaticPaths() {
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
  const contract = new ethers.Contract(process.env.NEXT_PUBLIC_ADDRESS, camp.abi, provider);

  const getAllCampaigns = contract.filters.campcreated();
  const AllCampaigns = await contract.queryFilter(getAllCampaigns);

  return {
    paths: AllCampaigns.map((e) => ({
      params: {
        address: e.args.campaignAddress.toString(),
      }
    })),
    fallback: "blocking"
  };
}

export async function getStaticProps(context) {
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
  let Data = {};
  let DonationsData = [];

  try {
    console.log("Context Params Address:", context.params.address);
    const contract = new ethers.Contract(context.params.address, Pro.abi, provider);

    console.log("Fetching data from contract...");
    const title = await contract.Title();
    const requiredAmount = await contract.requiredAmount();
    const image = await contract.Image();
    const storyUrl = await contract.story();
    const owner = await contract.owner();
    const receivedAmount = await contract.receivedAmount();

    console.log("Fetched Title:", title);
    console.log("Fetched RequiredAmount:", requiredAmount);
    console.log("Fetched Image:", image);
    console.log("Fetched Story URL:", storyUrl);
    console.log("Fetched Owner:", owner);
    console.log("Fetched ReceivedAmount:", receivedAmount);

    Data = {
      address: context.params.address,
      title,
      requiredAmount: ethers.formatEther(requiredAmount),
      image,
      receivedAmount: ethers.formatEther(receivedAmount),
      storyUrl,
      owner,
    };

    const Donations = contract.filters.donated();
    const AllDonations = await contract.queryFilter(Donations);

    DonationsData = AllDonations.map((e) => ({
      donar: e.args.donar,
      amount: ethers.formatEther(e.args.amount),
      timestamp: parseInt(e.args.timestamp),
    }));
  } catch (error) {
    console.error("❌ Error Fetching Data from Contract:", error);
  }

  console.log("Data being returned from getStaticProps:", Data); // Log the Data being returned

  return {
    props: {
      Data: Object.keys(Data).length > 0 ? Data : null, // Return null if Data is empty
      DonationsData,
    }
  };
}

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
