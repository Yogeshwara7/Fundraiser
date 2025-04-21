"use client";

import { useState, createContext } from "react";
import { ThemeProvider, styled } from "styled-components";
import themes from "./themes";

export const App = createContext();

const LayoutWrapper = styled.div`
  min-height: 100vh;
  background-color: ${(props) => props.theme.bgColor};
  background-image: ${(props) => props.theme.bgImage};
  color: ${(props) => props.theme.color};
`;

export default function ClientLayout({ children }) {
  const [theme, setTheme] = useState("light");

  const changeTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <App.Provider value={{ theme, changeTheme }}>
      <ThemeProvider theme={themes[theme]}>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </ThemeProvider>
    </App.Provider>
  );
} 