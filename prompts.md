# AI Development Prompts

This document contains the key AI prompts used throughout the development of the Seedify prediction market platform.

## Smart Contract Development

### Initial Contract Creation
```
Create a Solidity prediction market contract with the following features:
- Users can create prediction markets with yes/no outcomes
- Each market has a question, resolution date, and prize pool
- Users can buy shares for "yes" or "no" outcomes
- Share prices change based on supply and demand (automated market maker)
- Market creators can resolve markets when the outcome is known
- Include proper access controls and safety mechanisms
- Add events for all major actions
```

### Contract Testing
```
Write comprehensive tests for the prediction market contract using Hardhat and ethers.js. Test the following scenarios:
- Market creation
- Share buying and selling
- Price calculation
- Market resolution
- Edge cases and error conditions
```

## Backend Development

### Express Backend Setup
```
Set up Express backend with Groq AI integration for the prediction market platform. Include:
- RESTful API endpoints for market data
- Groq AI integration for market question validation
- WebSocket support for real-time updates
- Error handling middleware
- CORS configuration for frontend integration
```

### AI Integration
```
Integrate Groq AI API to analyze and validate prediction market questions. The AI should:
- Check if questions are clear and unambiguous
- Suggest improvements to question wording
- Identify potentially problematic or inappropriate content
- Provide confidence scores for question clarity
```

## Frontend Development

### React Chat Interface
```
Build a React chat interface with wallet connection for the prediction market platform. Include:
- MetaMask wallet integration
- Real-time chat functionality
- Market creation interface
- Share buying/selling interface
- Responsive design using Tailwind CSS
- TypeScript for type safety
```

### UI Improvements
```
Improve the user interface of the prediction market platform with:
- Better visual hierarchy for market information
- Interactive charts showing price history
- Loading states and error handling
- Mobile-responsive design
- Accessibility improvements
```

## Debugging and Problem Solving

### Contract Debugging
```
Debug the prediction market contract where users are unable to buy shares. The transaction keeps failing with a gas estimation error. Check:
- Contract function parameters
- Required approvals and allowances
- Gas limit settings
- Error messages in the contract
```

### Frontend State Management
```
Fix the React component state management issue where market data isn't updating after transactions. The problem might be:
- Missing state updates after blockchain interactions
- Incorrect dependency arrays in useEffect hooks
- Race conditions between multiple API calls
- Event listener setup for blockchain events
```

## Deployment and Infrastructure

### Smart Contract Deployment
```
Deploy the prediction market contract to both testnet and mainnet. Create deployment scripts that:
- Handle different network configurations
- Verify contracts on Etherscan
- Update frontend configuration with deployed addresses
- Handle deployment failures gracefully
```

### Full Stack Deployment
```
Set up production deployment for the prediction market platform including:
- Frontend deployment to Vercel/Netlify
- Backend deployment to Railway/Heroku
- Environment variable management
- Domain configuration and SSL setup
- Monitoring and error tracking
```

## Testing and Quality Assurance

### Integration Testing
```
Create end-to-end tests for the prediction market platform that verify:
- Complete user flow from market creation to resolution
- Wallet connection and transaction signing
- Real-time updates across multiple users
- Error handling for network issues
```

### Performance Optimization
```
Optimize the prediction market platform for better performance:
- Reduce gas costs for smart contract operations
- Implement caching for frequently accessed data
- Optimize frontend bundle size
- Add lazy loading for market data
```

## Documentation and Examples

### API Documentation
```
Create comprehensive API documentation for the prediction market backend. Include:
- Endpoint descriptions with request/response examples
- Authentication requirements
- Error codes and handling
- Rate limiting information
- WebSocket event documentation
```

### User Guide
```
Write a user guide for the prediction market platform explaining:
- How to connect a wallet
- Creating a new prediction market
- Buying and selling shares
- Understanding market odds and potential returns
- Resolving markets and claiming winnings