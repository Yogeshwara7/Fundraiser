// components/Header/HeaderLogo.js
"use client";
import styled from "styled-components";

const HeaderLogo = () => {
  return <Logo>FundRaiser</Logo>;
};

const Logo = styled.h1`
  font-weight: bold;
  font-size: 30px;
  margin-left: 10px;
  font-family: "Poppins";
  color: ${(props) => props.theme.color}; // Use theme
`;

export default HeaderLogo;