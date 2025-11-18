// server.js
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// ---------- Paths to data files ----------
const dataDir = path.join(__dirname, "data");
const offersFile = path.join(dataDir, "offers.json");
const requestsFile = path.join(dataDir, "requests.json");

// ---------- Helper functions ----------
function ensureFile(filePath, defaultData) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), "utf-8");
  }
}

function loadJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// Create JSON files if missing
ensureFile(offersFile, [
  { "name": "John", "skill": "Python" },
  { "name": "Mary", "skill": "Guitar" }
]);

ensureFile(requestsFile, [
  { "name": "Alex", "skill": "Piano" },
  { "name": "Lisa", "skill": "Cooking" }
]);

let offers = loadJson(offersFile);
let requests = loadJson(requestsFile);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- API ROUTES ----------

// Get all offers
app.get("/api/offers", (req, res) => {
  offers = loadJson(offersFile);
  res.json(offers);
});

// Add a new offer
app.post("/api/offers", (req, res) => {
  const { name, skill } = req.body;
  const newOffer = { name, skill };
  offers.push(newOffer);
  saveJson(offersFile, offers);
  res.status(201).json({ message: "Offer added" });
});

// Get all requests
app.get("/api/requests", (req, res) => {
  requests = loadJson(requestsFile);
  res.json(requests);
});

// Add a new request
app.post("/api/requests", (req, res) => {
  const { name, skill } = req.body;
  const newRequest = { name, skill };
  requests.push(newRequest);
  saveJson(requestsFile, requests);
  res.status(201).json({ message: "Request added" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
