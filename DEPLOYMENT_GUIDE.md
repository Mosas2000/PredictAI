# Deployment Guide

## Prerequisites

- Node.js + npm
- Private key with funds on target network
- `.env` configured (see `backend/.env.example`)

## Local

```bash
npx hardhat node
npx hardhat run scripts/deploy.ts --network hardhat
```

## BNB Testnet

```bash
npx hardhat run scripts/deploy.ts --network bnbTestnet
```

The script saves the deployed address to `deployments/`.

## Troubleshooting

- **"No signers available"** — check `PRIVATE_KEY` in `.env`
- **Deployment fails** — make sure deployer has enough gas funds
- **Network issues** — verify your RPC URL
