require('dotenv').config();  // Load environment variables from .env
const crypto = require('crypto');
// If using Node 18+, the Fetch API is globally available. For Node <18, you may need to install node-fetch.
// const fetch = (...); // e.g., require('node-fetch') if needed.

const API_KEY = process.env.COBO_API_KEY;
const API_SECRET = process.env.COBO_API_SECRET;  // Your ECDSA private key (secp256k1) in hex format
const BASE_URL = process.env.COBO_BASE_URL || 'https://api.cobo.com';  // Base URL (use dev or prod environment as needed)

if (!API_KEY || !API_SECRET) {
    throw new Error("Missing API key or secret. Please set COBO_API_KEY and COBO_API_SECRET in .env");
}

// Initialize ECDSA signing (secp256k1 curve)
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

/**
 * Helper to sign an API request using the API secret (ECDSA private key).
 * Cobo requires each request to be signed with ECDSA&#8203;:contentReference[oaicite:2]{index=2}. 
 * The message format is: "<METHOD>|<PATH>|<NONCE>|<PARAM_STRING>", where PARAM_STRING is 
 * the URL-encoded body or query parameters sorted by key.
 * Returns the signature as a hex string.
 */
function signRequest(method, path, nonce, params = {}) {
    // Create the params string (e.g. "amount=1.5&chain_id=ETH...")
    let paramsStr = '';
    if (params && Object.keys(params).length > 0) {
        const sortedKeys = Object.keys(params).sort();
        const keyValuePairs = sortedKeys.map(key => {
            const value = typeof params[key] === 'object' ? JSON.stringify(params[key]) : params[key];
            return `${key}=${value}`;
        });
        paramsStr = keyValuePairs.join('&');
    }

    const message = `${method.toUpperCase()}|${path}|${nonce}|${paramsStr}`;
    // Hash the message and sign it with the ECDSA private key
    const msgHash = crypto.createHash('sha256').update(message).digest();
    const keyPair = ec.keyFromPrivate(API_SECRET);
    const signature = keyPair.sign(msgHash);
    return signature.toDER('hex');  // hex-encoded DER signature
}

/**
 * Helper to perform an API request with proper headers and error handling.
 * Signs the request and includes `BIZ-API-KEY`, `BIZ-API-SIGNATURE`, and `BIZ-API-NONCE` headers&#8203;:contentReference[oaicite:3]{index=3}.
 */
async function apiRequest(method, path, bodyObj = null) {
    const nonce = Date.now().toString();  // use current timestamp (ms) as nonce
    const signature = signRequest(method, path, nonce, bodyObj || {});

    // Prepare headers
    const headers = {
        'BIZ-API-KEY': API_KEY,
        'BIZ-API-NONCE': nonce,
        'BIZ-API-SIGNATURE': signature,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    // Log the request details (without sensitive info)
    console.log(`[${new Date().toISOString()}] Request: ${method.toUpperCase()} ${BASE_URL}${path}`);
    if (bodyObj) {
        console.log(`Request Body: ${JSON.stringify(bodyObj)}`);
    }

    // Perform the HTTP request
    let response;
    try {
        response = await fetch(BASE_URL + path, {
            method: method.toUpperCase(),
            headers: headers,
            body: bodyObj ? JSON.stringify(bodyObj) : undefined
        });
    } catch (err) {
        console.error(`Network error during API call: ${err.message}`);
        throw err;
    }

    // Basic response logging
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    let result;
    try {
        result = await response.json();
    } catch {
        // If response is not JSON or JSON parsing fails
        const text = await response.text();
        console.error(`Invalid JSON response: ${text}`);
        throw new Error(`API returned non-JSON response (status ${response.status})`);
    }

    if (!response.ok) {
        // Log error details and throw
        console.error(`API Error Response: ${JSON.stringify(result)}`);
        throw new Error(`API request failed with status ${response.status}: ${result.message || response.statusText}`);
    }

    console.log(`Response Body: ${JSON.stringify(result)}`);  // Log response data
    return result;
}

/**
 * Create a new custodial wallet using Cobo’s API.
 * @param {string} name - Desired wallet name.
 * @returns {Promise<object>} The created wallet info (e.g. contains wallet_id).
 */
async function createWallet(name) {
    console.log('--- Creating a new wallet ---');
    console.log(`Wallet Name: ${name}`);
    // POST /v2/wallets to create a wallet&#8203;:contentReference[oaicite:4]{index=4}
    const body = { name: name, wallet_type: 'Custodial' };  // 'Custodial' wallet type
    const result = await apiRequest('POST', '/v2/wallets', body);
    console.log(`Wallet created successfully. ID: ${result.wallet_id}`);
    return result;
}

/**
 * Get an ETH deposit address for a given wallet.
 * This will generate (or retrieve) a deposit address on the Ethereum chain.
 * @param {string} walletId - The ID of the wallet.
 * @returns {Promise<string>} An Ethereum deposit address for the wallet.
 */
async function getDepositAddress(walletId) {
    console.log('--- Retrieving ETH deposit address ---');
    console.log(`Wallet ID: ${walletId}`);
    // POST /v2/wallets/{wallet_id}/addresses to create a new address&#8203;:contentReference[oaicite:5]{index=5}
    const body = { chain_id: 'ETH' };
    const result = await apiRequest('POST', `/v2/wallets/${walletId}/addresses`, body);
    // The API returns an array of address info objects. Grab the first address:
    const addressInfo = Array.isArray(result) ? result[0] : result;
    const depositAddress = addressInfo.address || '';
    console.log(`Ethereum deposit address: ${depositAddress}`);
    return depositAddress;
}

/**
 * Withdraw ETH from a wallet to an external address.
 * @param {string} walletId - The source wallet ID to withdraw from.
 * @param {string} toAddress - The external ETH address to send funds to.
 * @param {string|number} amount - The amount of ETH to withdraw (as a string or number).
 * @returns {Promise<object>} The API response for the withdrawal request (e.g. transaction details or request ID).
 */
async function withdrawETH(walletId, toAddress, amount) {
    console.log('--- Withdrawing ETH to external address ---');
    console.log(`Wallet ID: ${walletId}`);
    console.log(`Destination (external) address: ${toAddress}`);
    console.log(`Amount: ${amount} ETH`);
    // POST /v2/transactions/transfer to initiate a transfer/withdrawal&#8203;:contentReference[oaicite:6]{index=6}
    const body = {
        source_wallet_id: walletId,
        token_id: 'ETH',         // asset to transfer (ETH as the native token on Ethereum)
        to_address: toAddress,   // external address to send to
        amount: amount
        // You could include optional fields like fee, etc., if needed.
    };
    const result = await apiRequest('POST', '/v2/transactions/transfer', body);
    console.log(`Withdrawal request submitted. Response: ${JSON.stringify(result)}`);
    return result;
}

// Export the functions for use as a module
module.exports = { signRequest, apiRequest, createWallet, getDepositAddress, withdrawETH };
