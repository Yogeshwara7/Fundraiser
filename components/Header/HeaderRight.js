// components/Header/HeaderRight.js
"use client";
import styled from "styled-components";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useContext } from "react";
import { App } from "../../app/layout"; // Import App context
import Wallet from "./wallet";


const HeaderRight = () => {
  const ThemeToggler = useContext(App); // Use the App context

  return (
    <HeaderRightWrapper>
      <Wallet />
      <ThemeToggle>
        {ThemeToggler.theme === "light" ? (
          <DarkModeIcon onClick={ThemeToggler.changeTheme} />
        ) : (
          <LightModeIcon onClick={ThemeToggler.changeTheme} />
        )}
      </ThemeToggle>
    </HeaderRightWrapper>
  );
};

const HeaderRightWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 15px;
  height: 35%;
`;

const ThemeToggle = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${(props) => props.theme.accentColor};
  height: 100%;
  padding: 5px;
  width: 35px;
  border-radius: 12px;
  cursor: pointer;
`;

export default HeaderRight;