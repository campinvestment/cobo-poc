# Cobo API Script

A Node.js script for interacting with the Cobo cryptocurrency custody API. This script demonstrates how to use the Cobo API for wallet creation, deposit address generation, and ETH withdrawals.

## Features

- ECDSA request signing for Cobo API authentication
- Create custodial wallets
- Generate deposit addresses for wallets
- Withdraw ETH to external addresses
- Comprehensive error handling and logging

## Prerequisites

- Node.js (version 18+ recommended for built-in fetch API)
- Cobo API credentials (API key and secret)

## Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd cobo-script
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file and add your Cobo API credentials:
   ```
   COBO_API_KEY=your_api_key_here
   COBO_API_SECRET=your_api_secret_here
   COBO_BASE_URL=https://api.cobo.com
   ```

## Usage

Run the example script to see the API in action:

```bash
node src/index.js
```

The script demonstrates:
- Generating API request signatures
- Creating a new custodial wallet
- Getting a deposit address for a wallet
- Listing existing wallets
- Withdrawing ETH (commented out by default for safety)

## API Helper Functions

The `helper.js` module provides several utility functions:

### signRequest(method, path, nonce, params)

Signs an API request using ECDSA with your private key.

```javascript
const signature = signRequest('GET', '/v2/wallets', Date.now().toString(), { limit: 10 });
```

### apiRequest(method, path, bodyObj)

Makes an authenticated request to the Cobo API.

```javascript
const wallets = await apiRequest('GET', '/v2/wallets', { limit: 10 });
```

### createWallet(name)

Creates a new custodial wallet.

```javascript
const wallet = await createWallet('My Wallet');
console.log(`Wallet ID: ${wallet.wallet_id}`);
```

### getDepositAddress(walletId)

Gets an ETH deposit address for a wallet.

```javascript
const address = await getDepositAddress(wallet.wallet_id);
console.log(`Deposit to: ${address}`);
```

### withdrawETH(walletId, toAddress, amount)

Withdraws ETH from a wallet to an external address.

```javascript
const withdrawal = await withdrawETH(
  wallet.wallet_id,
  '0xYourExternalAddress',
  '0.01'
);
```

## Security Notes

- Never commit your `.env` file to version control
- Keep your API secret secure - it's used to sign all requests
- Test withdrawals with small amounts before larger transactions
- Consider implementing additional security measures for production use

## Customization

You can modify the example script or create your own by importing the helper functions:

```javascript
const { signRequest, apiRequest, createWallet } = require('./lib/helper');
```

## Troubleshooting

- If you get authentication errors, check your API key and secret
- For Node.js versions below 18, you may need to install and configure `node-fetch`
- Ensure your API key has the necessary permissions in the Cobo portal

## License

[Your License Here]

## Contact

[Your Contact Information]