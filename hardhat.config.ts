import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    bnbTestnet: {
      url: process.env.BNB_TESTNET_RPC_URL || "https://bsc-testnet.publicnode.com",
      chainId: 97,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5"
  },
  mocha: {
    timeout: 200000
  }
};

export default config;