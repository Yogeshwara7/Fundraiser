"use client";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import Link from "next/link";

const HeaderNav = () => {
  const pathname = usePathname(); // Get the current route path

  return (
    <HeaderNavWrapper>
      <Link href="/" passHref legacyBehavior>
        <HeaderNavLinks $isActive={pathname === "/"}>
          Campaigns
        </HeaderNavLinks>
      </Link>
      <Link href="/createcampaign" passHref legacyBehavior>
        <HeaderNavLinks $isActive={pathname === "/createcampaign"}>
          Create Campaign
        </HeaderNavLinks>
      </Link>
      <Link href="/dashboard" passHref legacyBehavior>
        <HeaderNavLinks $isActive={pathname === "/dashboard"}>
          Dashboard
        </HeaderNavLinks>
      </Link>
    </HeaderNavWrapper>
  );
};

const HeaderNavWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${(props) => props.theme.bgDiv};
  padding: 6px;
  height: 50%;
  border-radius: 10px;
`;

const HeaderNavLinks = styled.a`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${(props) =>
    props.$isActive ? props.theme.bgSubDiv : props.theme.bgDiv};
  height: 40%;
  font-family: "Roboto";
  margin: 7px;
  border-radius: 10px;
  padding: 10px 15px; /* Increased padding */
  text-transform: uppercase;
  font-weight: bold;
  font-size: small;
  cursor: pointer;
  color: ${(props) => props.theme.color}; /* Set text color based on theme */
  text-decoration: none; /* Remove underline */

  &:hover {
    opacity: 0.8; /* Optional: Add hover effect */
  }
`;

export default HeaderNav;