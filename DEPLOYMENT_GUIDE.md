# PredictionMarket Contract Deployment Guide

This guide explains how to deploy the PredictionMarket contract using the provided Hardhat deployment script.

## Prerequisites

1. Node.js and npm installed
2. Hardhat configured for your target network
3. Environment variables set up (for testnet/mainnet deployments)

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your configuration:
   - `PRIVATE_KEY`: Your deployer account's private key (with 0x prefix)
   - `BNB_TESTNET_RPC_URL`: RPC URL for BNB Testnet (or other testnet)
   - `GREETER_MESSAGE`: Optional greeting message (not used for PredictionMarket)

## Deployment Script Features

The deployment script (`scripts/deploy.ts`) includes the following features:

1. **Contract Deployment**: Deploys the PredictionMarket contract
2. **Address Logging**: Logs the deployed contract address
3. **Deployment Verification**: Verifies the contract was deployed correctly
4. **Functionality Testing**: Tests basic contract functionality
5. **Address Saving**: Saves the contract address to JSON files

## Deployment Commands

### Local Hardhat Network
For testing purposes:
```bash
npx hardhat run scripts/deploy.ts --network hardhat
```

### BNB Testnet
For BNB Testnet deployment:
```bash
npx hardhat run scripts/deploy.ts --network bnbTestnet
```

### Other Networks
For other configured networks:
```bash
npx hardhat run scripts/deploy.ts --network <network-name>
```

## Deployment Output

The script will output:
1. Network information
2. Deployer account details
3. Contract deployment details (address, transaction hash, gas used)
4. Verification results
5. Functionality test results
6. File save locations

## Deployment Files

After deployment, the script creates two files in the `deployments/` directory:

1. `{network-name}.json`: Network-specific deployment information
2. `latest.json`: The most recent deployment information (overwritten each time)

Example deployment file content:
```json
{
  "PredictionMarket": {
    "contractName": "PredictionMarket",
    "address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "network": "hardhat",
    "deploymentTime": "2025-11-14T17:12:54.733Z",
    "transactionHash": "0xcd6d8ab73a02b85d7220f1e00ae99bb3c7f0ef669726f0324355f8833a01f701",
    "gasUsed": "1050685",
    "blockNumber": 1
  }
}
```

## Contract Verification

The script performs basic verification by:
1. Checking if contract code exists at the deployed address
2. Verifying the owner is set correctly
3. Testing market creation functionality

## Block Explorer URLs

The script automatically generates appropriate block explorer URLs based on the network:
- BNB Testnet: https://testnet.bscscan.com
- BNB Mainnet: https://bscscan.com
- Hardhat: No block explorer (shows transaction hash and address instead)

## Troubleshooting

### No Signers Available
If you get "No signers available for deployment":
1. Check your `.env` file contains a valid `PRIVATE_KEY`
2. Ensure the private key has the correct format (0x prefix)
3. Verify the network configuration in `hardhat.config.ts`

### Network Connection Issues
If you experience network connection issues:
1. Check your RPC URL is correct and accessible
2. Verify your internet connection
3. Try using a different RPC endpoint

### Contract Deployment Fails
If deployment fails:
1. Check your account has sufficient funds
2. Verify the contract compiles correctly (`npx hardhat compile`)
3. Check for any error messages in the output

## Post-Deployment

After successful deployment:
1. Save the deployed contract address for your frontend/application
2. Consider verifying the contract on the block explorer (if applicable)
3. Update your application configuration with the new contract address