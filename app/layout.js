// app/layout.js
"use client";
import { useState, createContext } from "react";
import { ThemeProvider, createGlobalStyle, styled } from "styled-components"; // Import styled
import themes from "../components/themes";
import Header from "../components/Header/Header";
import {ToastContainer,toast} from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';
// Create and export the App context
export const App = createContext();

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    overflow-x: hidden;
    background-color: ${(props) => props.theme.bgColor};
    color: ${(props) => props.theme.color};
    background-image: ${(props) => props.theme.bgImage};
  }
`;

const LayoutWrapper = styled.div`
  min-height: 100vh;
  background-color: ${(props) => props.theme.bgColor};
  background-image: ${(props) => props.theme.bgImage};
  color: ${(props) => props.theme.color};
`;

export default function RootLayout({ children }) {
  const [theme, setTheme] = useState("light"); // Default theme

  const changeTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <App.Provider value={{ theme, changeTheme }}>
      <ThemeProvider theme={themes[theme]}>
      <ToastContainer />
        <html lang="en">
          <body>
            <GlobalStyle />
            <LayoutWrapper>
              <Header />
              {children}
            </LayoutWrapper>
          </body>
        </html>
      </ThemeProvider>
    </App.Provider>
  );
}