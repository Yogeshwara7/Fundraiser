const light = {
  color: "#333333", // Dark gray text for better readability
  bgColor: "#f5f5f5", // Light gray background
  bgImage: "linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 100%)", // Subtle light gray gradient
  bgDiv: "#ffffff", // White for div backgrounds
  bgSubDiv: "#e0e0e0", // Light gray for sub-div backgrounds
  accentColor: "#007bff", // Blue for accents (e.g., buttons, links)
};

const dark = {
  color: "#ffffff", // White text for contrast
  bgColor: "#1a1a1a", // Dark background
  bgImage: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", // Dark gradient
  bgDiv: "#2a2a2a", // Slightly lighter dark gray for divs
  bgSubDiv: "#333333", // Dark gray for sub-divs
  accentColor: "#00ffff", // Neon cyan for accents
};

const vibrant = {
  color: "#ffffff", // White text for contrast
  bgColor: "#ff6f61", // Coral background color
  bgImage: "linear-gradient(180deg, #ff6f61 0%, #ffcc5c 100%)", // Gradient from coral to golden yellow
  bgDiv: "#ffcc5c", // Golden yellow for div backgrounds
  bgSubDiv: "#ff6f61", // Coral for sub-div backgrounds
  accentColor: "#00bfff", // Bright blue for accents
};

const themes = {
  light: light,
  dark: dark,
  vibrant: vibrant,
};


export default themes;