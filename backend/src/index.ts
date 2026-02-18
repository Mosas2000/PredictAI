import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import Groq from 'groq-sdk';

// Load environment variables
dotenv.config();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Contract ABI
const PREDICTION_MARKET_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "question",
        "type": "string"
      }
    ],
    "name": "createMarket",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "getMarket",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "question",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "totalYesBets",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalNoBets",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "resolved",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "winningOutcome",
            "type": "bool"
          }
        ],
        "internalType": "struct PredictionMarket.Market",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "betYes",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "betNo",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "question",
        "type": "string"
      }
    ],
    "name": "MarketCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "bettor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "outcome",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "BetPlaced",
    "type": "event"
  }
];

// Helper function to extract and validate numeric amount from message
function extractAndValidateAmount(message: string): { amount: string | null, isValid: boolean } {
  // Match patterns like "0.00001 BNB", "1.5 ETH", "100 USDC", etc.
  const amountPattern = /(\d+\.?\d*)\s*([a-zA-Z]+)/i;
  const match = message.match(amountPattern);
  
  if (!match || !match[1]) {
    return { amount: null, isValid: false };
  }
  
  const extractedAmount = match[1];
  
  // Validate that the extracted amount is a valid number
  const numValue = parseFloat(extractedAmount);
  if (isNaN(numValue) || numValue <= 0) {
    return { amount: null, isValid: false };
  }
  
  return { amount: extractedAmount, isValid: true };
}

// Setup provider and contract
let provider: ethers.JsonRpcProvider;
let contract: ethers.Contract;
let wallet: ethers.Wallet;

try {
  provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
  wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider);
  contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS || '',
    PREDICTION_MARKET_ABI,
    wallet
  );
  console.log('Contract setup successful');
} catch (error) {
  console.error('Failed to setup contract:', error);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// POST endpoint /api/chat
app.post('/api/chat', async (req: express.Request, res: express.Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const lowerMessage = message.toLowerCase();
    let responseText = '';
    let shouldUseGroq = true;

    // FIRST: Check if this is a CLEAR transaction request with specific parameters
    // Only trigger blockchain logic when there's clear intent with required details

    // Check for CLEAR market creation request with specific question
    const createMarketPatterns = [
      /create\s+(?:a\s+)?market\s+(?:about|for|on)\s+(.+)/i,
      /new\s+market\s+(?:about|for|on)\s+(.+)/i,
      /start\s+(?:a\s+)?market\s+(?:about|for|on)\s+(.+)/i,
      /create\s+(?:a\s+)?prediction\s+market\s+(?:about|for|on)\s+(.+)/i
    ];

    let isClearMarketCreation = false;
    let marketQuestion = null;

    for (const pattern of createMarketPatterns) {
      const match = message.match(pattern);
      if (match && match[1] && match[1].trim().length > 5) {
        isClearMarketCreation = true;
        marketQuestion = `Will ${match[1].trim()}?`;
        break;
      }
    }

    if (isClearMarketCreation && marketQuestion) {
      shouldUseGroq = false;
      try {
        // Create the market on the blockchain
        const tx = await contract.createMarket(marketQuestion);
        const receipt = await tx.wait();
        
        // Extract the market ID from the MarketCreated event
        let marketId = "unknown";
        if (receipt.events) {
          const marketCreatedEvent = receipt.events.find((e: any) => e.event === 'MarketCreated');
          if (marketCreatedEvent && marketCreatedEvent.args) {
            marketId = marketCreatedEvent.args[0].toString();
          }
        }
        
        // Get the transaction URL for BSC testnet
        const txUrl = `https://testnet.bscscan.com/tx/${tx.hash}`;
        
        responseText = `✅ **Market Successfully Created on Blockchain!**

**Market Details:**
- Question: ${marketQuestion}
- Market ID: ${marketId}
- Transaction Hash: ${tx.hash}
- Status: Confirmed on BNB Testnet

**View Transaction:** ${txUrl}

The market is now live on the blockchain! Users can start placing bets on "Yes" or "No" outcomes. The market creator can resolve it once the outcome is determined.`;
        
      } catch (error) {
        console.error('Error creating market:', error);
        responseText = `❌ **Failed to Create Market**

I encountered an error while trying to create the market on the blockchain:
${error instanceof Error ? error.message : 'Unknown error'}

Please check:
- The contract is properly deployed
- Your wallet has sufficient funds for gas
- Network connectivity is stable

You can try again or contact support if the issue persists.`;
      }
    }
    // Check for CLEAR bet placement request with specific market ID, amount, and outcome
    else {
      // Extract market ID (must be specific)
      const marketIdMatch = message.match(/market\s+(\d+)/i) ||
                           message.match(/id\s+(\d+)/i) ||
                           message.match(/#(\d+)/i);
      
      // Extract and validate amount using our helper function
      const amountResult = extractAndValidateAmount(message);
      
      // Extract currency (must be specific)
      const currencyMatch = message.match(/(\d+\.?\d*)\s*(bnb|eth|matic|usdc|usdt)/i);
      let extractedCurrency = null;
      if (currencyMatch && currencyMatch[2]) {
        extractedCurrency = currencyMatch[2].toLowerCase();
      }
      
      // Extract outcome (must be specific)
      let outcome = null;
      if (lowerMessage.includes('yes') && !lowerMessage.includes('maybe')) {
        outcome = 'yes';
      } else if (lowerMessage.includes('no') && !lowerMessage.includes('know')) {
        outcome = 'no';
      }
      
      // Check for bet placement patterns with all required parameters
      const betPatterns = [
        /bet\s+(\d+\.?\d*)\s*(bnb|eth|matic|usdc|usdt)\s+(?:on\s+)?(?:yes|no)\s+(?:for\s+)?market\s+(\d+)/i,
        /place\s+(?:a\s+)?bet\s+(?:of\s+)?(\d+\.?\d*)\s*(bnb|eth|matic|usdc|usdt)\s+(?:on\s+)?(?:yes|no)\s+(?:for\s+)?market\s+(\d+)/i,
        /wager\s+(\d+\.?\d*)\s*(bnb|eth|matic|usdc|usdt)\s+(?:on\s+)?(?:yes|no)\s+(?:for\s+)?market\s+(\d+)/i,
        /market\s+(\d+).*?bet\s+(\d+\.?\d*)\s*(bnb|eth|matic|usdc|usdt).*?(?:yes|no)/i
      ];
      
      let isClearBetRequest = false;
      let extractedMarketId = null;
      let extractedAmount = null;
      let extractedOutcome = null;
      
      // First check for complete patterns
      for (const pattern of betPatterns) {
        const match = message.match(pattern);
        if (match) {
          let patternAmount = null;
          let patternCurrency = null;
          
          if (pattern.source.includes('market')) {
            // Pattern where market comes first
            extractedMarketId = match[1];
            patternAmount = match[2];
            patternCurrency = match[3];
          } else {
            // Pattern where amount comes first
            patternAmount = match[1];
            patternCurrency = match[2];
            extractedMarketId = match[3];
          }
          
          // Validate the extracted amount
          const amountValidation = extractAndValidateAmount(patternAmount + ' ' + patternCurrency);
          if (amountValidation.isValid) {
            extractedAmount = amountValidation.amount;
            extractedCurrency = patternCurrency.toLowerCase();
          }
          
          // Determine outcome from message
          if (lowerMessage.includes('yes') && !lowerMessage.includes('maybe')) {
            extractedOutcome = 'yes';
          } else if (lowerMessage.includes('no') && !lowerMessage.includes('know')) {
            extractedOutcome = 'no';
          }
          
          if (extractedMarketId && extractedAmount && extractedCurrency && extractedOutcome) {
            isClearBetRequest = true;
            break;
          }
        }
      }
      
      // If no complete pattern matched, check for individual components
      if (!isClearBetRequest && marketIdMatch && amountResult.isValid && extractedCurrency && outcome) {
        isClearBetRequest = true;
        extractedMarketId = marketIdMatch[1];
        extractedAmount = amountResult.amount;
        extractedOutcome = outcome;
      }
      
      if (isClearBetRequest) {
        shouldUseGroq = false;
        try {
          // Double-check that we have a valid amount
          if (!extractedAmount) {
            throw new Error('Invalid bet amount: Amount is null or empty');
          }
          
          // Convert amount to wei based on currency
          let amountInWei;
          if (extractedCurrency === 'bnb' || extractedCurrency === 'eth') {
            amountInWei = ethers.parseEther(extractedAmount);
          } else if (extractedCurrency === 'matic') {
            amountInWei = ethers.parseEther(extractedAmount); // MATIC also uses 18 decimals
          } else if (extractedCurrency === 'usdc' || extractedCurrency === 'usdt') {
            amountInWei = ethers.parseUnits(extractedAmount, 6); // USDC/USDT typically use 6 decimals
          } else {
            amountInWei = ethers.parseEther(extractedAmount); // Default to 18 decimals
          }
          
          // Get market details to include in response
          const marketDetails = await contract.getMarket(extractedMarketId);
          
          // Place the bet based on outcome
          let tx;
          if (extractedOutcome === 'yes') {
            tx = await contract.betYes(extractedMarketId, { value: amountInWei });
          } else {
            tx = await contract.betNo(extractedMarketId, { value: amountInWei });
          }
          
          const receipt = await tx.wait();
          
          // Get the transaction URL for BSC testnet
          const txUrl = `https://testnet.bscscan.com/tx/${tx.hash}`;
          
          responseText = `✅ **Bet Successfully Placed on Blockchain!**

**Bet Details:**
- Market ID: ${extractedMarketId}
- Question: ${marketDetails.question}
- Your Bet: ${extractedOutcome?.toUpperCase() || 'UNKNOWN'}
- Amount: ${extractedAmount} ${extractedCurrency.toUpperCase()}
- Transaction Hash: ${tx.hash}
- Status: Confirmed on BNB Testnet

**View Transaction:** ${txUrl}

Your bet has been recorded on the blockchain! If your prediction is correct, you can claim your winnings after the market is resolved. Good luck!`;
          
        } catch (error) {
          console.error('Error placing bet:', error);
          responseText = `❌ **Failed to Place Bet**

I encountered an error while trying to place your bet on the blockchain:
${error instanceof Error ? error.message : 'Unknown error'}

Please check:
- The market ID exists and is not resolved
- You have sufficient funds for the bet and gas fees
- The bet amount meets the minimum requirements
- Network connectivity is stable

You can try again or contact support if the issue persists.`;
        }
      }
    }

    // Use Groq for general queries or when shouldUseGroq is true
    if (shouldUseGroq) {
      try {
        const systemPrompt = `You are a helpful assistant for a blockchain-based prediction market platform. Your role is to:

1. Explain how prediction markets work
2. Help users understand the platform features
3. Provide guidance on creating markets and placing bets
4. Answer questions about market mechanics and blockchain integration

Key points to emphasize:
- Prediction markets allow trading contracts based on future event outcomes
- Our platform uses blockchain for transparency and security
- Smart contracts handle automatic payouts
- Users can create markets on various topics
- Bets are placed on "Yes" or "No" outcomes
- Markets are resolved by creators when outcomes are determined
- Current markets are being created for events through December 31, 2025

Always be helpful, clear, and concise. Avoid technical jargon when possible, but explain blockchain concepts when relevant.`;

        const chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: message
            }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
          max_tokens: 1024,
        });

        responseText = chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
      } catch (groqError) {
        console.error('Error calling Groq API:', groqError);
        // Fallback to a default response if Groq fails
        responseText = "Welcome to our prediction market platform! I'm here to help you understand how prediction markets work, create new markets, or place bets on existing ones. \n\nYou can ask me to:\n- Explain how prediction markets work\n- Help you create a new prediction market\n- Guide you through placing a bet\n- Answer questions about market mechanics\n\nWhat would you like to know more about?";
      }
    }

    // Return response
    res.json({
      message: responseText,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// GET endpoint /api/markets
app.get('/api/markets', async (req: express.Request, res: express.Response) => {
  try {
    // Since we don't have a direct way to get all markets, we'll start with ID 1 and increment
    // until we find a market that doesn't exist
    const markets = [];
    let marketId = 1;
    const maxMarkets = 100; // Safety limit to prevent infinite loop
    
    while (marketId <= maxMarkets) {
      try {
        const market = await contract.getMarket(marketId);
        markets.push({
          id: marketId,
          question: market.question,
          totalYesBets: ethers.formatEther(market.totalYesBets),
          totalNoBets: ethers.formatEther(market.totalNoBets),
          resolved: market.resolved,
          winningOutcome: market.winningOutcome
        });
        marketId++;
      } catch (error: any) {
        // If we get an error that the market doesn't exist, we've reached the end
        if (error.message.includes('MarketDoesNotExist') || error.code === 'CALL_EXCEPTION') {
          break;
        }
        // For other errors, log and continue
        console.error(`Error fetching market ${marketId}:`, error);
        marketId++;
      }
    }
    
    res.json({
      markets,
      count: markets.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/markets:', error);
    res.status(500).json({ error: 'Failed to fetch markets' });
  }
});

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Log environment variables (without sensitive data)
  console.log('Environment variables loaded:');
  console.log('- PORT:', process.env.PORT || 3001);
  console.log('- API_KEY configured:', !!process.env.API_KEY);
  console.log('- GROQ_API_KEY configured:', !!process.env.GROQ_API_KEY);
  console.log('- GROQ_API_KEY configured:', !!process.env.GROQ_API_KEY);
  console.log('- ETHEREUM_RPC_URL configured:', !!process.env.ETHEREUM_RPC_URL);
});

export default app;