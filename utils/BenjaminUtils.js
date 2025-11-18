const fs = require('fs');
const path = require('path');

/**
 * Load local API keys from utils/api_keys.json if present.
 * This file is optional and should NOT be committed with real secrets.
 */
function loadLocalKeys() {
  try {
    const p = path.join(__dirname, 'api_keys.json');
    if (!fs.existsSync(p)) return {};
    const raw = fs.readFileSync(p, 'utf8');
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    // Don't throw — return empty object so callers fallback to env only
    return {};
  }
}

/**
 * Get an API key by name.
 * Lookup order:
 *  1. process.env[name]
 *  2. process.env[name.toUpperCase()]
 *  3. process.env["API_" + name.toUpperCase()]
 *  4. utils/api_keys.json (if present)
 *
 * Returns the key string or null if not found.
 */
function getApiKey(name, options = { fallbackToFile: true }) {
  if (!name) return null;
  const keyName = String(name);
  const candidates = [keyName, keyName.toUpperCase(), `API_${keyName.toUpperCase()}`];

  for (const envName of candidates) {
    if (process.env[envName]) return process.env[envName];
  }

  if (options && options.fallbackToFile) {
    const keys = loadLocalKeys();
    if (keys && (keyName in keys)) return keys[keyName];
    if (keys && (keyName.toUpperCase() in keys)) return keys[keyName.toUpperCase()];
  }

  return null;
}

module.exports = { getApiKey, loadLocalKeys };
