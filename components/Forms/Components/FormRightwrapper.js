import styled from "styled-components";
import { useState, useContext } from "react";
import { FormState } from "../Form";
import { toast } from "react-toastify";
import { TailSpin } from "react-loader-spinner";
import axios from "axios";

const SERVER_URL = "http://localhost:5000/upload"; // Ensure backend is running

const FormRightwrapper = () => {
  const Handler = useContext(FormState);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const uploadFiles = async (e) => {
    e.preventDefault();
    setUploadLoading(true);

    try {
      const formData = new FormData();

      // If an image is selected, add it to the FormData
      if (Handler.image) {
        formData.append("file", Handler.image);
      }

      // Upload image first (if selected)
      let imageIpfsHash = "";
      if (Handler.image) {
        const response = await axios.post(SERVER_URL, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.data.success) {
          imageIpfsHash = response.data.ipfsHash;
          Handler.setImageUrl(imageIpfsHash);
        } else {
          throw new Error(response.data.error || "Image upload failed");
        }
      }

      // If story exists, upload it as text
      let storyIpfsHash = "";
      if (Handler.form.story.trim() !== "") {
        const textBlob = new Blob([Handler.form.story], { type: "text/plain" });
        const textFormData = new FormData();
        textFormData.append("file", textBlob, "story.txt");

        const storyResponse = await axios.post(SERVER_URL, textFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (storyResponse.data.success) {
          storyIpfsHash = storyResponse.data.ipfsHash;
          Handler.setStoryUrl(storyIpfsHash);
        } else {
          throw new Error(storyResponse.data.error || "Story upload failed");
        }
      }

      setUploaded(true);
      Handler.setUploaded(true); // ✅ Use consistent naming
      toast.success("Files uploaded successfully!");
    } catch (error) {
      toast.warn(error.response?.data?.error || "Error Uploading Files");
      console.error("Upload Error:", error.response?.data || error.message);
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <FormRight>
      <FormInput>
        <FormRow>
          <RowFirstInput>
            <label>Required Amount</label>
            <Input
              onChange={Handler?.FormHandler}
              value={Handler?.form?.requiredAmount || ""}
              name="requiredAmount"
              type="number"
              placeholder="Enter amount"
            />
          </RowFirstInput>
          <RowSecondInput>
            <label>Choose category</label>
            <Select
              onChange={Handler?.FormHandler}
              value={Handler?.form?.category || ""}
              name="category"
            >
              <option value="">Select a category</option>
              <option value="Education">Education</option>
              <option value="Health">Health</option>
              <option value="Gaming">Gaming</option>
              <option value="Animal">Animal</option>
              <option value="Social Media">Social Media</option>
              <option value="Music">Music</option>
            </Select>
          </RowSecondInput>
        </FormRow>
      </FormInput>

      <FormInput>
        <label>Select Image</label>
        <FileInput
          onChange={Handler?.imageHandler}
          type="file"
          accept="image/*"
        />
      </FormInput>

      {uploadLoading ? (
        <TailSpin color="#fff" height={20} />
      ) : !uploaded ? (
        <Button onClick={uploadFiles}>Upload Files to IPFS</Button>
      ) : (
        <Button  >Files uploaded successfully</Button>
      )}

      <Button onClick={Handler.startCampaign} type="submit">
        Create Campaign
      </Button>
    </FormRight>
  );
};

// Styled Components (unchanged)
const FormRight = styled.div`
  width: 48%;
`;

const FormInput = styled.div`
  display: flex;
  flex-direction: column;
  font-family: "Poppins", sans-serif;
  margin-top: 10px;
`;

const FormRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
`;

const RowFirstInput = styled.div`
  display: flex;
  flex-direction: column;
  width: 48%;
  margin-right: 60px;
`;

const RowSecondInput = styled.div`
  display: flex;
  flex-direction: column;
  width: 48%;
`;

const Input = styled.input`
  padding: 15px;
  background-color: ${(props) => props.theme.bgDiv};
  color: ${(props) => props.theme.color};
  margin-top: 4px;
  border: none;
  border-radius: 9px;
  outline: none;
  font-size: large;
  width: 100%;
`;

const Select = styled.select`
  padding: 15px;
  background-color: ${(props) => props.theme.bgDiv};
  color: ${(props) => props.theme.color};
  margin-top: 4px;
  border: none;
  border-radius: 9px;
  outline: none;
  font-size: large;
  width: 100%;
  cursor: pointer;
`;

const FileInput = styled.input`
  background-color: ${(props) => props.theme.bgImage};
  color: ${(props) => props.theme.color};
  margin-top: 4px;
  border: none;
  border-radius: 9px;
  outline: none;
  font-size: large;
  width: 100%;
  cursor: pointer;

  &::-webkit-file-upload-button {
    padding: 15px;
    background-color: ${(props) => props.theme.bgSubDiv};
    color: ${(props) => props.theme.color};
    border: none;
    cursor: pointer;
    font-size: medium;
  }
`;

const Button = styled.button`
  padding: 15px;
  background-color: #0077b6;
  background-image: ${(props) => props.theme.accentColor};
  margin-top: 30px;
  border: none;
  outline: none;
  font-size: large;
  border-radius: 10px;
  width: 100%;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${(props) => props.theme.bgDivHover};
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

export default FormRightwrapper;