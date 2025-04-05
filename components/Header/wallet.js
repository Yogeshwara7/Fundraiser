import styled from "styled-components";
import { ethers } from "ethers";
import { useState } from "react";

// Holesky Network Configuration
const holeskyNetwork = {
  chainId: "0x4268", // 17000 in hex
  chainName: "Holesky Testnet",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: [process.env.NEXT_PUBLIC_RPC_URL],
  blockExplorerUrls: ["https://explorer.holesky.etherscan.io"],
};

const Wallet = () => {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [ensName, setEnsName] = useState("");
  const [connected, setConnected] = useState(false); // new state

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      if (network.chainId !== 17000n) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [holeskyNetwork],
          });
        } catch (switchError) {
          console.error("Failed to switch to Holesky:", switchError);
          alert("Please switch to the Holesky network in MetaMask.");
          return;
        }
      }

      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      let displayAddress = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
      let resolvedEnsName = null;

      try {
        resolvedEnsName = await provider.lookupAddress(userAddress);
        if (resolvedEnsName) displayAddress = resolvedEnsName;
      } catch (ensError) {
        console.log("ENS resolution failed:", ensError);
      }

      setAddress(displayAddress);
      setEnsName(resolvedEnsName);
      setConnected(true);

      const userBalance = ethers.formatEther(await provider.getBalance(userAddress));
      setBalance(parseFloat(userBalance).toFixed(4));
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const disconnectWallet = () => {
    setAddress("");
    setBalance("");
    setEnsName("");
    setConnected(false);
  };

  return (
    <WalletDetails>
      {connected ? (
        <WalletInfo>
          {ensName && <EnsName>{ensName}</EnsName>}
          <WalletAddress>{address}</WalletAddress>
          <LogoutButton onClick={disconnectWallet}>disconnect</LogoutButton>
        </WalletInfo>
      ) : (
        <ConnectButton onClick={connectWallet}>Connect Wallet</ConnectButton>
      )}
    </WalletDetails>
  );
};

// Styled Components (same as before, plus LogoutButton)
const WalletDetails = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const WalletInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const WalletAddress = styled.span`
  font-family: "Roboto";
  font-size: 12px;
  color: ${(props) => props.theme.color};
  background-color: ${(props) => props.theme.bgSubDiv};
  padding: 4px 8px;
  border-radius: 8px;
  margin-bottom: 4px;
`;

const WalletBalance = styled.span`
  font-family: "Roboto";
  font-size: 12px;
  color: ${(props) => props.theme.color};
  background-color: ${(props) => props.theme.bgSubDiv};
  padding: 4px 8px;
  border-radius: 8px;
`;

const ConnectButton = styled.span`
  font-family: "Roboto";
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  color: ${(props) => props.theme.color};
  background-color: ${(props) => props.theme.bgSubDiv};
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(props) => props.theme.color};
    color: ${(props) => props.theme.bgSubDiv};
  }
`;

const LogoutButton = styled.button`
  margin-top: 6px;
  font-size: 12px;
  padding: 5px 10px;
  border: none;
  border-radius: 6px;
  background-color: ${(props) => props.theme.bgSubDiv};
  color: ${(props) => props.theme.color};
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${(props) => props.theme.color};
    color: ${(props) => props.theme.bgSubDiv};
  }
`;

const EnsName = styled.span`
  font-family: "Roboto";
  font-size: 12px;
  font-weight: bold;
  color: ${(props) => props.theme.color};
`;

export default Wallet;
