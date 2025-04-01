require("dotenv").config({ path: ".env.local" });

const express = require("express");
const cors = require("cors"); // ✅ Import CORS
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const app = express();
const PORT = 5000;

// ✅ Enable CORS and Body Parsers
app.use(cors());
app.use(express.json()); // Parse JSON request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded form data

// Pinata API Credentials
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

// Multer setup for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

// Upload file & description to Pinata
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const filePath = req.file?.path;
        const description = req.body.description || "No description provided"; // ✅ Make description optional

        if (!filePath) {
            return res.status(400).json({ success: false, error: "No file uploaded" });
        }

        const formData = new FormData();
        formData.append("file", fs.createReadStream(filePath));

        // ✅ Always send metadata, even if description is empty
        const metadata = JSON.stringify({ name: req.file.originalname, description });
        formData.append("pinataMetadata", metadata);

        const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
            headers: {
                "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
                pinata_api_key: PINATA_API_KEY,
                pinata_secret_api_key: PINATA_SECRET_API_KEY,
            },
        });

        fs.unlinkSync(filePath); // Cleanup after upload

        res.json({ success: true, ipfsHash: response.data.IpfsHash });
    } catch (error) {
        console.error("Upload error:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
