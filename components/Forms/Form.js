"use client";
import styled from "styled-components";
import FormRightwrapper from "./Components/FormRightwrapper";
import Formleftwrapper from "./Components/Formleftwrapper";
import { createContext, useState } from "react";
import { TailSpin } from "react-loader-spinner";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import camp from '../../artifacts/contracts/lock.sol/camp.json';
import { useRouter } from "next/navigation";

const FormState = createContext();

const Form = () => {
    const router = useRouter(); // ✅ Initialize router

    const [form, setForm] = useState({
        campaignTitle: "",
        story: "",
        requiredAmount: "",
        category: "",
    });
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState("");
    const [uploaded, setUploaded] = useState(false);
    const [storyUrl, setStoryUrl] = useState(""); // ✅ IPFS URL for story
    const [imageUrl, setImageUrl] = useState(""); // ✅ IPFS URL for image
    const [image, setImage] = useState(null);

    const FormHandler = (e) => {
        setForm((prevForm) => ({
            ...prevForm,
            [e.target.name]: e.target.value,
        }));
    };

    const imageHandler = (e) => {
        if (e.target.files.length > 0) {
            setImage(e.target.files[0]);
        }
    };

    const startCampaign = async (e) => {
        e.preventDefault();
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        if (form.campaignTitle === "") {
            toast.warn("Title Field Is Empty");
        } else if (form.story === "") {
            toast.warn("Story Field Is Empty");
        } else if (form.requiredAmount === "") {
            toast.warn("Required Amount Field Is Empty");
        } else if (!uploaded) {
            toast.warn("Files upload Required");
        } else {
            try {
                setLoading(true);
                const contract = new ethers.Contract(
                    process.env.NEXT_PUBLIC_ADDRESS,
                    camp.abi,
                    signer
                );

                // Create campaign with explicit gas parameters
                const campaignData = await contract.createcamp(
                    form.campaignTitle,
                    ethers.parseEther(form.requiredAmount),
                    imageUrl,
                    storyUrl,
                    form.category,
                    {
                        gasLimit: 3000000
                    }
                );

                await campaignData.wait();
                setAddress(campaignData.to);
            } catch (error) {
                console.error("Transaction Failed:", error);
                setLoading(false);
                if (error.message.includes("user rejected")) {
                    toast.error("Transaction rejected by user");
                } else {
                    toast.error("Transaction failed. Please try again");
                }
            }
        }
    };

    return (
        <FormState.Provider value={{ form, setForm, image, setImage, imageHandler, FormHandler, setImageUrl, setStoryUrl, startCampaign, setUploaded, uploaded }}>
            <FormWrapper>
                <FormMain>
                    {loading ? (
                        !address ? (
                            <Spinner>
                                <TailSpin height={50} />
                            </Spinner>
                        ) : (
                            <Address>
                                <h1>Campaign Started Successfully</h1>
                                <h1>{address}</h1>
                                <Button onClick={() => router.push("/")}>
                                    Go To Campaign
                                </Button>
                            </Address>
                        )
                    ) : (
                        <FormInputWrapper>
                            <Formleftwrapper />
                            <FormRightwrapper />
                        </FormInputWrapper>
                    )}
                </FormMain>
            </FormWrapper>
        </FormState.Provider>
    );
};

// Styled Components
const FormWrapper = styled.div`
    width: 100%;
    justify-content: center;
    display: flex;
`;

const FormMain = styled.div`
    width: 80%;
`;

const FormInputWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    margin-top: 50px;
`;

const Spinner = styled.div`
    width: 100%;
    height: 80vh;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const Address = styled.div`
    width: 100%;
    height: 80vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: ${(props) => props.theme.bgSubDiv};
    border-radius: 14px;
`;

const Button = styled.div`
    display: flex;
    justify-content: center;
    width: 30%;
    padding: 15px;
    color: white;
    background-color: ${(props) => props.theme.accentColor};
    border: none;
    margin-top: 30px;
    cursor: pointer;
    font-size: large;
    font-weight: bold;
`;

export default Form;
export { FormState };