# PredictAI

Decentralized prediction market platform on BNB Chain. Create binary markets, bet on outcomes, and claim winnings on-chain.

## Stack

- **Contracts**: Solidity + Hardhat + TypeChain
- **Backend**: Express + TypeScript + Groq
- **Frontend**: React + Vite + Tailwind CSS

## Getting Started

```bash
# install deps
npm install
cd backend && npm install
cd ../frontend && npm install

# set up env
cp backend/.env.example backend/.env
# fill in GROQ_API_KEY, PRIVATE_KEY, ETHEREUM_RPC_URL

# run locally
npx hardhat node                                          # terminal 1
npx hardhat run scripts/deploy.ts --network localhost     # terminal 2
cd backend && npm run dev                                 # terminal 3
cd frontend && npm run dev                                # terminal 4
```

Frontend at `localhost:5173`, API at `localhost:3001`.

## Smart Contract

The `PredictionMarket` contract supports:

- Creating binary (yes/no) markets
- Placing bets with BNB
- Resolving markets (owner only)
- Claiming proportional winnings

```bash
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network bnbTestnet
```

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for full deployment instructions.

## License

MIT
