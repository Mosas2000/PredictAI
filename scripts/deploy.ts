import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

interface DeploymentInfo {
  contractName: string;
  address: string;
  network: string;
  deploymentTime: string;
  transactionHash: string;
  gasUsed: string;
  blockNumber: number;
}

async function main() {
  console.log("Starting deployment of PredictionMarket contract...");
  
  // Get the network information
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "hardhat" : network.name;
  console.log(`Deploying to network: ${networkName} (Chain ID: ${network.chainId})`);
  
  // Get deployer account
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    console.error("No signers available for deployment. Please check your network configuration.");
    console.log("For local testing, try using: npx hardhat node");
    console.log("Then deploy with: npx hardhat run scripts/deploy.ts --network localhost");
    process.exit(1);
  }
  const deployer = signers[0];
  console.log(`Deploying contracts with account: ${deployer.address}`);
  
  // Check account balance
  const balance = await deployer.getBalance();
  console.log(`Account balance: ${ethers.utils.formatEther(balance)} ETH`);
  
  // Deploy the PredictionMarket contract
  console.log("Deploying PredictionMarket contract...");
  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const predictionMarket = await PredictionMarket.deploy();
  
  // Wait for deployment to complete
  console.log("Waiting for deployment transaction to be mined...");
  await predictionMarket.deployed();
  
  // Get deployment transaction details
  const deploymentTx = predictionMarket.deployTransaction;
  const receipt = await deploymentTx.wait();
  
  // Log deployment information
  console.log("\n=== Deployment Successful ===");
  console.log(`Contract Name: PredictionMarket`);
  console.log(`Deployed Address: ${predictionMarket.address}`);
  console.log(`Transaction Hash: ${deploymentTx.hash}`);
  console.log(`Block Number: ${receipt.blockNumber}`);
  console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
  console.log(`Network: ${networkName} (Chain ID: ${network.chainId})`);
  
  // Verify the deployment by checking the contract code
  console.log("\n=== Verifying Deployment ===");
  const code = await ethers.provider.getCode(predictionMarket.address);
  if (code === "0x") {
    console.error("❌ Verification failed: No contract code found at the deployed address");
    process.exit(1);
  } else {
    console.log("✅ Verification successful: Contract code found at the deployed address");
  }
  
  // Test basic contract functionality
  console.log("\n=== Testing Contract Functionality ===");
  try {
    // Check if owner is set correctly
    const owner = await predictionMarket.owner();
    if (owner === deployer.address) {
      console.log("✅ Owner verification passed");
    } else {
      console.log(`❌ Owner verification failed: Expected ${deployer.address}, got ${owner}`);
    }
    
    // Test creating a market to verify contract functionality
    console.log("Testing market creation...");
    const tx = await predictionMarket.createMarket("Test market for deployment verification");
    const receipt = await tx.wait();
    
    // Extract the market ID from the MarketCreated event
    const event = receipt.events?.find(e => e.event === "MarketCreated");
    if (event && event.args) {
      const marketId = event.args[0];
      console.log(`✅ Market creation test passed - Created market with ID: ${marketId}`);
      
      // Verify the market was created correctly
      const market = await predictionMarket.getMarket(marketId);
      if (market.question === "Test market for deployment verification") {
        console.log("✅ Market data verification passed");
      } else {
        console.log("❌ Market data verification failed");
      }
    } else {
      console.log("❌ Market creation event not found");
    }
  } catch (error) {
    console.error("❌ Contract functionality test failed:", error);
  }
  
  // Save deployment information to JSON file
  console.log("\n=== Saving Deployment Information ===");
  const deploymentInfo: DeploymentInfo = {
    contractName: "PredictionMarket",
    address: predictionMarket.address,
    network: networkName,
    deploymentTime: new Date().toISOString(),
    transactionHash: deploymentTx.hash,
    gasUsed: receipt.gasUsed.toString(),
    blockNumber: receipt.blockNumber
  };
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save to network-specific file
  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
  let deployments: { [key: string]: DeploymentInfo } = {};
  
  // Load existing deployments if file exists
  if (fs.existsSync(deploymentFile)) {
    const existingData = fs.readFileSync(deploymentFile, "utf8");
    deployments = JSON.parse(existingData);
  }
  
  // Add or update the deployment info
  deployments[deploymentInfo.contractName] = deploymentInfo;
  
  // Write the updated deployments to file
  fs.writeFileSync(deploymentFile, JSON.stringify(deployments, null, 2));
  console.log(`✅ Deployment information saved to: ${deploymentFile}`);
  
  // Also save to a latest deployment file for easy access
  const latestFile = path.join(deploymentsDir, "latest.json");
  fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`✅ Latest deployment information saved to: ${latestFile}`);
  
  console.log("\n=== Deployment Summary ===");
  console.log(`PredictionMarket contract successfully deployed to ${predictionMarket.address} on ${networkName}`);
  
  // Generate appropriate block explorer URLs based on network
  let explorerUrl = "";
  if (networkName === "bnbTestnet" || networkName === "bnbt") {
    explorerUrl = "https://testnet.bscscan.com";
  } else if (networkName === "hardhat") {
    explorerUrl = "Hardhat network (no block explorer)";
  } else {
    explorerUrl = "https://bscscan.com";
  }
  
  if (explorerUrl && explorerUrl !== "Hardhat network (no block explorer)") {
    console.log(`Transaction: ${explorerUrl}/tx/${deploymentTx.hash}`);
    console.log(`Contract: ${explorerUrl}/address/${predictionMarket.address}`);
  } else {
    console.log(`Transaction Hash: ${deploymentTx.hash}`);
    console.log(`Contract Address: ${predictionMarket.address}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });