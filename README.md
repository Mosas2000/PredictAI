# Seedify Prediction Market Platform

A decentralized prediction market platform built with blockchain technology and AI-powered development.

![Built with AI](https://img.shields.io/badge/Built%20with-AI-blue?style=for-the-badge)
![Vibe Coded](https://img.shields.io/badge/Vibe%20Coded-purple?style=for-the-badge)

## Built with AI 🤖

This project was developed using a collaborative AI-human workflow, leveraging cutting-edge AI tools to accelerate development and enhance code quality. Learn more about our development approach in [VIBE_CODING.md](./VIBE_CODING.md) and [ai_logs/README.md](./ai_logs/README.md).

### AI Tools Used
- **Claude**: Architecture planning, complex problem-solving, and code review
- **Kilo**: Day-to-day coding, file creation, and implementation tasks
- **Groq AI**: Backend AI integration for market question validation

### Development Approach
- **Vibe Coding**: Conversational development with AI as creative partners
- **Rapid Prototyping**: Full-stack application built in hours, not weeks
- **Iterative Refinement**: Continuous improvement through AI-human collaboration

## Contract Overview

The `PredictionMarket` contract allows:
- Owner to create binary prediction markets
- Users to bet on "Yes" or "No" outcomes
- Owner to resolve markets with winning outcomes
- Users to claim proportional winnings based on their bets

## Key Features

- **Market Management**: Only owner can create and resolve markets
- **Betting System**: Payable functions for Yes/No bets with tracking
- **Proportional Payouts**: Winners receive proportional share of total pool
- **Event Logging**: All major actions emit events
- **Error Handling**: Custom errors for gas-efficient failures
- **TypeScript Support**: Full TypeChain integration

## Contract Structure

### State Variables
- `owner`: Contract owner address
- `nextMarketId`: Auto-incrementing market ID counter
- `markets`: Mapping of market ID to Market struct
- `yesBets`/`noBets`: User bet amounts per market
- `hasClaimed`: Claim status tracking

### Market Struct
```solidity
struct Market {
    uint256 id;
    string question;
    uint256 totalYesBets;
    uint256 totalNoBets;
    bool resolved;
    bool winningOutcome; // true = yes wins, false = no wins
}
```

### Functions

#### Owner Functions
- `createMarket(string calldata question)` - Creates new market
- `resolveMarket(uint256 id, bool winningOutcome)` - Resolves market

#### User Functions
- `betYes(uint256 id)` - Bet on Yes outcome (payable)
- `betNo(uint256 id)` - Bet on No outcome (payable)
- `claim(uint256 id)` - Claim winnings after resolution

#### View Functions
- `getMarket(uint256 id)` - Returns market details
- `getUserBets(uint256 id, address user)` - Returns user's bet info

### Events
- `MarketCreated(uint256 indexed id, string question)`
- `BetPlaced(uint256 indexed id, address indexed bettor, bool outcome, uint256 amount)`
- `MarketResolved(uint256 indexed id, bool winningOutcome, uint256 totalYesBets, uint256 totalNoBets)`
- `WinningsClaimed(uint256 indexed id, address indexed user, uint256 payout)`

### Custom Errors
- `OnlyOwner()` - Unauthorized access
- `MarketDoesNotExist(uint256 id)` - Invalid market ID
- `MarketAlreadyResolved(uint256 id)` - Market already resolved
- `InvalidBetAmount()` - Zero bet amount
- `AlreadyClaimed(uint256 id, address user)` - Duplicate claim
- `NoWinnings(uint256 id, address user)` - No winnings to claim
- `CannotResolveWithoutBets(uint256 id)` - No bets in market
- `TransferFailed()` - ETH transfer failed

## TypeScript Types

The contract includes comprehensive TypeScript types via TypeChain:

### Market Types
```typescript
type MarketStruct = {
  id: BigNumberish;
  question: string;
  totalYesBets: BigNumberish;
  totalNoBets: BigNumberish;
  resolved: boolean;
  winningOutcome: boolean;
};
```

### Event Types
```typescript
type MarketCreatedEvent = TypedEvent<[BigNumber, string], MarketCreatedEventObject>;
type BetPlacedEvent = TypedEvent<[BigNumber, string, boolean, BigNumber], BetPlacedEventObject>;
type MarketResolvedEvent = TypedEvent<[BigNumber, boolean, BigNumber, BigNumber], MarketResolvedEventObject>;
type WinningsClaimedEvent = TypedEvent<[BigNumber, string, BigNumber], WinningsClaimedEventObject>;
```

### Contract Interface
Full ethers.js contract interface with:
- Function signatures and return types
- Event filters and listeners
- Call static, estimate gas, and populate transaction methods
- Factory deployment support

## Usage Example

```typescript
import { PredictionMarket, PredictionMarket__factory } from './typechain';

// Deploy contract
const factory = new PredictionMarket__factory(signer);
const contract = await factory.deploy();

// Create market
const tx = await contract.createMarket("Will ETH price exceed $3000 by end of year?");
const receipt = await tx.wait();
const marketId = receipt.events?.[0].args?.id;

// Place bets
await contract.betYes(marketId, { value: ethers.utils.parseEther("1.0") });
await contract.betNo(marketId, { value: ethers.utils.parseEther("0.5") });

// Resolve market (owner only)
await contract.resolveMarket(marketId, true);

// Claim winnings
await contract.claim(marketId);

// Listen to events
contract.on("MarketCreated", (id, question) => {
  console.log(`Market ${id} created: ${question}`);
});
```

## Security Considerations

- Uses checks-effects-interactions pattern
- Reentrancy protection via state updates before external calls
- Proper access control with owner-only functions
- Safe ETH transfers with failure handling
- Input validation for all functions

## Gas Optimization

- Custom errors instead of revert strings
- Efficient storage packing in structs
- Minimal external calls
- Optimized event emissions

## Testing

The project includes a comprehensive test suite covering all contract functionality:

### Test Coverage
- **Market Creation**: Creating markets, ID incrementation, authorization checks
- **Placing Bets**: Yes/No bets, multiple bets, validation checks
- **Market Resolution**: Resolving markets, authorization, edge cases
- **Claiming Winnings**: Payout calculations, multiple winners, error handling
- **Edge Cases**: Resolved markets, single winners, equal pools, small bets

### Running Tests

```bash
# Install dependencies (first time only)
npm install

# Run all tests
npm test

# Or directly with Hardhat
npx hardhat test

# Quick setup script (installs deps and runs tests)
./scripts/setup-tests.sh
```

### Test Structure
- Located in `test/PredictionMarket.test.ts`
- Uses Mocha test framework and Chai assertions
- Tests all contract functions and edge cases
- Validates event emissions and error conditions
- Tests with multiple user accounts and realistic scenarios

## How to Run Locally

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd Seedify
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. **Set up environment variables**
```bash
# Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit the files with your configuration
```

4. **Start the development environment**

**Terminal 1: Start Hardhat local blockchain**
```bash
npx hardhat node
```

**Terminal 2: Deploy smart contracts**
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

**Terminal 3: Start the backend server**
```bash
cd backend
npm run dev
```

**Terminal 4: Start the frontend application**
```bash
cd frontend
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Hardhat Network: http://localhost:8545

### Development Commands

**Smart Contract Development**
```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat run scripts/deploy.ts --network localhost
```

**Backend Development**
```bash
cd backend
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm test         # Run tests
```

**Frontend Development**
```bash
cd frontend
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm test         # Run tests
```

## Deployment Instructions

### Smart Contract Deployment

1. **Configure network settings** in `hardhat.config.ts`
2. **Set up environment variables** for the target network
3. **Deploy contracts**:
```bash
# Deploy to testnet
npx hardhat run scripts/deploy.ts --network goerli

# Deploy to mainnet
npx hardhat run scripts/deploy.ts --network mainnet
```

### Frontend Deployment

1. **Build the frontend**:
```bash
cd frontend
npm run build
```

2. **Deploy to Vercel**:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

3. **Configure environment variables** in Vercel dashboard

### Backend Deployment

1. **Build the backend**:
```bash
cd backend
npm run build
```

2. **Deploy to Railway**:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

3. **Configure environment variables** in Railway dashboard

### Environment Variables

**Backend (.env)**
```
PORT=3001
NODE_ENV=development
GROQ_API_KEY=your_groq_api_key
ETHEREUM_RPC_URL=your_ethereum_rpc_url
CONTRACT_ADDRESS=your_deployed_contract_address
PRIVATE_KEY=your_private_key
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:3001
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
VITE_ETHEREUM_NETWORK=localhost
```

## Architecture Overview

This project consists of three main components:

1. **Smart Contracts** (`/contracts`): Ethereum smart contracts for the prediction market logic
2. **Backend** (`/backend`): Express.js server with Groq AI integration
3. **Frontend** (`/frontend`): React.js application with wallet connection

For detailed documentation on our AI-powered development process, check out:
- [VIBE_CODING.md](./VIBE_CODING.md) - Our collaborative development workflow
- [ai_logs/README.md](./ai_logs/README.md) - AI tools and their impact
- [prompts.md](./prompts.md) - Key AI prompts used throughout development

## License

MIT License