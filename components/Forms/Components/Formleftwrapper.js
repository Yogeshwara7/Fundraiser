import styled from "styled-components";
import { FormState } from "../Form";
import { useContext } from "react";

const Formleftwrapper = () => {
    const Handler = useContext(FormState);

    console.log("Current Story Value:", Handler.form.story); // ✅ Debugging

    return (
        <Formleft>
            {/* Campaign Title Input */}
            <FormInput>
                <Label>Campaign Title</Label>
                <Input 
                    onChange={Handler.FormHandler} 
                    value={Handler.form.campaignTitle || ""} // ✅ Fixed camelCase
                    placeholder="Campaign Title" 
                    name="campaignTitle" 
                />
            </FormInput>

            {/* Description Input */}
            <FormInput>
                <Label>Description</Label>
                <Textarea 
                    onChange={Handler.FormHandler} 
                    value={Handler.form.story || ""}  // ✅ Lowercase "story" for consistency
                    name="story"  
                    placeholder="Describe your story" 
                    rows="5" 
                />
            </FormInput>
        </Formleft>
    );
};

// Styled components
const Formleft = styled.div`
    width: 48%;
`;

const FormInput = styled.div`
    display: flex;
    flex-direction: column;
    font-family: "Poppins", sans-serif;
    margin-top: 20px;
`;

const Label = styled.label`
    font-size: 16px;
    font-weight: 500;
    color: ${(props) => props.theme.color};
    margin-bottom: 8px;
`;

const Input = styled.input`
    padding: 15px;
    background-color: ${(props) => props.theme.bgDiv};
    color: ${(props) => props.theme.color};
    border: 1px solid ${(props) => props.theme.bgSubDiv};
    border-radius: 8px;
    outline: none;
    font-size: 16px;
    width: 100%;
    transition: all 0.3s ease;

    &:hover {
        border-color: ${(props) => props.theme.accentColor};
    }

    &:focus {
        border-color: ${(props) => props.theme.accentColor};
        box-shadow: 0 0 8px ${(props) => props.theme.accentColor};
    }
`;

const Textarea = styled.textarea`
    padding: 15px;
    background-color: ${(props) => props.theme.bgDiv};
    color: ${(props) => props.theme.color};
    border: 1px solid ${(props) => props.theme.bgSubDiv};
    border-radius: 8px;
    outline: none;
    font-size: 16px;
    width: 100%;
    min-height: 150px;
    resize: vertical;
    transition: all 0.3s ease;

    &:hover {
        border-color: ${(props) => props.theme.accentColor};
    }

    &:focus {
        border-color: ${(props) => props.theme.accentColor};
        box-shadow: 0 0 8px ${(props) => props.theme.accentColor};
    }
`;

export default Formleftwrapper;
