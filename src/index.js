#!/usr/bin/env node
/**
 * Example script demonstrating the use of Cobo API helper functions
 * 
 * This script shows how to use the helper functions from the helper.js module
 * to interact with the Cobo API for cryptocurrency custody operations.
 */

// Import the helper functions
const { signRequest, apiRequest, createWallet, getDepositAddress, withdrawETH } = require('./lib/helper');

// Define an async main function to use await
async function main() {
  try {
    // Example 0: Using signRequest directly
    console.log('\n=== Example 0: Using signRequest directly ===');
    const method = 'GET';
    const path = '/v2/wallets';
    const nonce = Date.now().toString();
    const params = { limit: 10, offset: 0 };
    
    const signature = signRequest(method, path, nonce, params);
    console.log(`Generated signature: ${signature}`);
    console.log(`This signature can be used in the 'BIZ-API-SIGNATURE' header for API requests`);
    
    // Example 1: Create a new wallet
    console.log('\n=== Example 1: Creating a new wallet ===');
    const walletName = 'Test Wallet ' + Date.now(); // Use timestamp to ensure unique name
    const wallet = await createWallet(walletName);
    console.log(`Wallet created with ID: ${wallet.wallet_id}`);
    
    // Example 2: Get a deposit address for the wallet
    console.log('\n=== Example 2: Getting a deposit address ===');
    const depositAddress = await getDepositAddress(wallet.wallet_id);
    console.log(`Deposit address: ${depositAddress}`);
    
    // Example 3: Using apiRequest directly
    console.log('\n=== Example 3: Using apiRequest directly ===');
    console.log('Fetching list of wallets using apiRequest...');
    const walletList = await apiRequest('GET', '/v2/wallets', { limit: 10, offset: 0 });
    console.log(`Retrieved ${walletList.length || 0} wallets`);
    
    // Example 4: Withdraw ETH (commented out for safety - uncomment and modify when ready to use)
    /*
    console.log('\n=== Example 4: Withdrawing ETH ===');
    const toAddress = '0xYourExternalEthereumAddress'; // Replace with a real ETH address
    const amount = '0.01'; // Amount in ETH
    const withdrawal = await withdrawETH(wallet.wallet_id, toAddress, amount);
    console.log(`Withdrawal initiated: ${JSON.stringify(withdrawal)}`);
    */
    
    console.log('\nAll operations completed successfully!');
  } catch (error) {
    console.error('Error occurred:', error.message);
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
