
import React, { useState, useEffect } from 'react';
import { Wallet, Send, Bot, User, X, Eye, TrendingUp, TrendingDown, Copy, ExternalLink, Loader2, BarChart3, Sparkles, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

interface Market {
  id: number;
  question: string;
  totalYesBets: string;
  totalNoBets: string;
  resolved: boolean;
  winningOutcome?: boolean;
}

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

const CONTRACT_ADDRESS = "0x1250489fC1A1E8eA89f1bf6aB247BBdA70Cf801D";

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showMarkets, setShowMarkets] = useState(false);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [marketsLoading, setMarketsLoading] = useState(false);
  
  // Betting state
  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [betOutcome, setBetOutcome] = useState<'yes' | 'no' | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [betLoading, setBetLoading] = useState(false);
  const [betError, setBetError] = useState<string | null>(null);
  const [transactionPending, setTransactionPending] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const fetchMarkets = async (showModal = true) => {
    setMarketsLoading(true);
    try {
      // Add cache-busting timestamp to ensure fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/markets?t=${timestamp}`);
      const data = await response.json();
      setMarkets(data.markets || []);
      if (showModal) {
        setShowMarkets(true);
      }
    } catch (error) {
      console.error('Error fetching markets:', error);
      alert('Failed to fetch markets. Please try again.');
    } finally {
      setMarketsLoading(false);
    }
  };

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
        console.error('Wallet provider details:', {
          hasEthereum: typeof window.ethereum !== 'undefined',
          ethereum: window.ethereum
        });
      }
    } else {
      console.warn('No wallet provider detected. Please install a wallet like Rabby or MetaMask.');
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        console.log('Attempting to connect to wallet...');
        console.log('Wallet provider:', window.ethereum);
        
        // Check if we're on correct network before connecting
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const bnbTestnetChainId = '0x61'; // BNB Testnet chain ID
        
        if (chainId !== bnbTestnetChainId) {
          // Try to switch to BNB Testnet
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: bnbTestnetChainId }],
            });
          } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: bnbTestnetChainId,
                      chainName: 'BNB Smart Chain Testnet',
                      nativeCurrency: {
                        name: 'BNB',
                        symbol: 'BNB',
                        decimals: 18,
                      },
                      rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
                      blockExplorerUrls: ['https://testnet.bscscan.com'],
                    },
                  ],
                });
              } catch (addError) {
                console.error('Error adding BNB Testnet:', addError);
                alert('Failed to add BNB Testnet to your wallet. Please add it manually.');
                return;
              }
            } else {
              console.error('Error switching to BNB Testnet:', switchError);
              alert('Please switch to BNB Testnet in your wallet settings.');
              return;
            }
          }
        }
        
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
          console.log('Successfully connected to wallet:', accounts[0]);
          
          // Show success message
          const successMessage: Message = {
            id: Date.now().toString(),
            text: `🔗 **Wallet Connected Successfully!**
            
Your wallet (${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}) is now connected to BNB Testnet.
            
You can now:
- Create prediction markets
- Place bets on existing markets
- View your transaction history

Ready to start predicting! 🚀`,
            sender: 'bot',
            timestamp: new Date().toISOString(),
          };
          setMessages(prev => [...prev, successMessage]);
        } else {
          console.warn('No accounts returned after wallet connection request');
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
        console.error('Wallet connection error details:', {
          error,
          hasEthereum: typeof window.ethereum !== 'undefined',
          ethereum: window.ethereum
        });
        
        // Provide more specific error messages based on the error
        let errorMessage = 'Failed to connect wallet. Please try again.';
        
        if (error instanceof Error) {
          if ((error as any).message.includes('User rejected') || (error as any).code === 4001) {
            errorMessage = '🚫 **Connection Cancelled**\n\nYou cancelled wallet connection. No problem! Click "Connect Wallet" when you\'re ready to try again.';
          } else if ((error as any).message.includes('Already processing')) {
            errorMessage = '⏳ **Connection in Progress**\n\nYour wallet is already processing a connection request. Please wait a moment and try again.';
          } else {
            errorMessage = `❌ **Connection Error**\n\n${(error as any).message}\n\nPlease make sure your wallet is unlocked and try again.`;
          }
        }
        
        // Show error message in chat
        const errorMessageObj: Message = {
          id: Date.now().toString(),
          text: `${errorMessage}

**💡 Wallet Setup Tips:**
- Ensure your wallet (MetaMask, Rabby, etc.) is installed and unlocked
- Make sure you're on BNB Testnet network
- Check that your wallet has BNB testnet tokens
- Try refreshing the page and reconnecting

Need help? Contact support for assistance.`,
          sender: 'bot',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessageObj]);
      }
    } else {
      const errorMessage = `🔍 **No Wallet Detected**

No Web3 wallet was found. Please install a wallet to use this app.

**Recommended Wallets:**
- **MetaMask**: https://metamask.io/download/
- **Rabby**: https://rabby.io/
- **Trust Wallet**: https://trustwallet.com/

**Setup Steps:**
1. Install your preferred wallet browser extension
2. Create or import your wallet
3. Switch to BNB Testnet network
4. Get testnet BNB from a faucet
5. Return here and click "Connect Wallet"

Need help? Check our setup guide!`;
      
      console.error('No wallet detected');
      
      // Show detailed setup message in chat
      const setupMessage: Message = {
        id: Date.now().toString(),
        text: errorMessage,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, setupMessage]);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setIsConnected(false);
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputValue }),
      });

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Check if a bet was placed and refresh markets if modal is open
      const lowerMessage = inputValue.toLowerCase();
      if ((lowerMessage.includes('bet') || lowerMessage.includes('place bet') || lowerMessage.includes('wager')) &&
          data.message.includes('Bet Successfully Placed') &&
          showMarkets) {
        // Refresh markets after a successful bet
        fetchMarkets(false); // Don't show modal again, just refresh data
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      console.log('Copied to clipboard:', text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const placeBet = async (marketId: number, outcome: 'yes' | 'no', amount: string, retryCount = 0) => {
    if (!window.ethereum || !isConnected) {
      setBetError('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setBetError('Please enter a valid bet amount');
      return;
    }

    // Prevent multiple simultaneous transactions
    if (transactionPending) {
      setBetError('A transaction is already in progress. Please wait for it to complete.');
      return;
    }

    setBetLoading(true);
    setBetError(null);
    setTransactionPending(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PREDICTION_MARKET_ABI, signer);

      const amountInWei = ethers.parseEther(amount);
      
      // Check if user has sufficient balance before attempting transaction
      const balance = await provider.getBalance(signer.getAddress());
      const gasEstimate = await contract[outcome === 'yes' ? 'betYes' : 'betNo'].estimateGas(marketId, { value: amountInWei });
      const gasPrice = await provider.getFeeData();
      const estimatedGasCost = gasEstimate * (gasPrice.gasPrice || 0n);
      
      if (balance < amountInWei + estimatedGasCost) {
        throw new Error('Insufficient balance: You need enough BNB for both the bet and gas fees.');
      }
      
      let tx;
      if (outcome === 'yes') {
        tx = await contract.betYes(marketId, { value: amountInWei });
      } else {
        tx = await contract.betNo(marketId, { value: amountInWei });
      }

      setPendingTxHash(tx.hash);

      // Show transaction pending message
      const pendingMessage: Message = {
        id: Date.now().toString(),
        text: `⏳ **Transaction Pending**
        
Your bet of ${amount} BNB on "${outcome}" for market #${marketId} is being processed...
Transaction Hash: ${tx.hash}

View on BSC Scan: https://testnet.bscscan.com/tx/${tx.hash}

**Please wait for confirmation...** This usually takes 10-30 seconds on BNB Testnet.`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, pendingMessage]);

      const receipt = await tx.wait();

      // Show success message
      const successMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `✅ **Bet Successfully Placed on Blockchain!**

**Bet Details:**
- Market ID: ${marketId}
- Your Bet: ${outcome.toUpperCase()}
- Amount: ${amount} BNB
- Transaction Hash: ${tx.hash}
- Status: Confirmed on BNB Testnet
- Block Number: ${receipt.blockNumber}

**View Transaction:** https://testnet.bscscan.com/tx/${tx.hash}

Your bet has been recorded on the blockchain! If your prediction is correct, you can claim your winnings after the market is resolved. Good luck! 🎯`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, successMessage]);

      // Close modal and reset state
      setShowBetModal(false);
      setSelectedMarket(null);
      setBetOutcome(null);
      setBetAmount('');
      
      // Refresh markets
      fetchMarkets(false);
    } catch (error: any) {
      console.error('Error placing bet:', error);
      
      let errorMessage = 'Failed to place bet. Please try again.';
      let canRetry = false;
      
      // Handle specific error codes with better user messages
      if ((error as any).code === 4001) {
        errorMessage = '🚫 **Transaction Cancelled**\n\nYou cancelled the transaction in your wallet. No problem! You can try again when you\'re ready.';
        canRetry = true;
      } else if ((error as any).code === -32603) {
        errorMessage = '💰 **Insufficient Funds**\n\nYou don\'t have enough BNB for this transaction. Please check:\n- Sufficient balance for the bet amount\n- Enough BNB for gas fees (typically 0.001-0.005 BNB)\n\nGet more BNB from the testnet faucet and try again.';
      } else if ((error as any).message.includes('insufficient funds')) {
        errorMessage = '💰 **Insufficient Balance**\n\nYour wallet doesn\'t have enough BNB for this transaction. Please add more funds and try again.';
      } else if ((error as any).message.includes('Insufficient balance')) {
        errorMessage = '💰 **Insufficient Balance**\n\nYou need more BNB to cover both the bet and gas fees. Please add funds to your wallet.';
      } else if ((error as any).code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMessage = '⚠️ **Transaction Might Fail**\n\nThis transaction is likely to fail. This could happen if:\n- The market has already been resolved\n- The bet amount is too small\n- There\'s an issue with the contract\n\nPlease check the market status and try again.';
      } else if ((error as any).message.includes('MarketDoesNotExist')) {
        errorMessage = '🔍 **Market Not Found**\n\nThis market doesn\'t exist or may have been deleted. Please refresh the markets and try again.';
      } else if ((error as any).message.includes('MarketAlreadyResolved')) {
        errorMessage = '🏁 **Market Already Resolved**\n\nThis market has already been resolved and no longer accepts bets. Please choose an active market.';
      } else if ((error as any).message.includes('nonce')) {
        errorMessage = '🔄 **Nonce Error**\n\nThere was an issue with the transaction sequence. Please try again in a few seconds.';
        canRetry = true;
      } else if ((error as any).message.includes('replacement transaction underpriced')) {
        errorMessage = '⚡ **Gas Price Too Low**\n\nThe gas price for this transaction is too low. Please try again with a higher gas price.';
        canRetry = true;
      } else if ((error as any).message) {
        errorMessage = '❌ **Transaction Error**\n\n' + (error as any).message;
  const openBetModal = (market: Market, outcome: 'yes' | 'no') => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    setSelectedMarket(market);
    setBetOutcome(outcome);
    setBetAmount('');
    setBetError(null);
    setShowBetModal(true);
  };

  const formatMessageWithLinks = (text: string) => {
    // Replace transaction hashes with clickable links and copy buttons
    return text.replace(
      /Transaction Hash: (0x[a-fA-F0-9]{64})/g,
      (match, hash) => {
        return `Transaction Hash:
          <div class="flex items-center gap-2 mt-1 flex-wrap">
            <span class="font-mono text-xs bg-slate-600 px-2 py-1 rounded break-all max-w-full overflow-x-auto break-words overflow-wrap-anywhere">${hash}</span>
            <div class="flex items-center gap-1 flex-shrink-0">
              <button
                onclick="window.open('https://testnet.bscscan.com/tx/${hash}', '_blank')"
                class="p-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center justify-center"
                title="View on BSC Scan"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2H5a2 2 0 0 1-2v-6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2v-6a2 2 0 0 1 2 2z"/>
                  <polyline points="15 3 21 3 21"/>
                </svg>
              </button>
              <button
                onclick="navigator.clipboard.writeText('${hash}')"
                class="p-1 bg-gray-600 hover:bg-gray-700 rounded transition-colors flex items-center justify-center"
                title="Copy hash"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1m6 4h1a2 2 0 0 1 2-2v-4a2 2 0 0 1 2-2h-1"/>
                </svg>
              </button>
            </div>
          </div>`;
      }
    ).replace(
      /View Transaction: (https:\/\/testnet\.bscscan\.com\/tx\/0x[a-fA-F0-9]{64})/g,
      (match, url) => {
        const hash = url.match(/0x[a-fA-F0-9]{64}/)?.[0];
        return `View Transaction:
          <div class="flex items-center gap-2 mt-1 flex-wrap">
            <button
              onclick="window.open('${url}', '_blank')"
              class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
            >
              Open in Explorer
            </button>
            ${hash ? `
              <button
                onclick="navigator.clipboard.writeText('${hash}')"
                class="p-1 bg-gray-600 hover:bg-gray-700 rounded transition-colors flex items-center justify-center"
                title="Copy hash"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1m6 4h1a2 2 0 0 1 2-2v-4a2 2 0 0 1 2-2h-1"/>
                </svg>
              </button>
            ` : ''}
          </div>`;
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105">
              <img src="/logo.png" alt="Seedify" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Seedify</h1>
              <span className="text-sm text-gray-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Decentralized Prediction Markets
              </span>
            </div>
          </div>
          
          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => fetchMarkets(true)}
              disabled={marketsLoading}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 px-4 py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Eye className="w-4 h-4" />
              <span>{marketsLoading ? 'Loading...' : 'View Markets'}</span>
            </button>
            {isConnected && walletAddress ? (
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                <Wallet className="w-4 h-4 text-green-400" />
                <span className="text-sm font-mono">{formatAddress(walletAddress)}</span>
                <button
                  onClick={disconnectWallet}
                  className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-2 py-1 rounded-lg transition-all duration-300"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-4 py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </header>

        {/* Chat Container */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          <div className="h-[600px] flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-300 py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
                    <Bot className="w-10 h-10" />
                  </div>
                  <p className="text-xl mb-2 font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Welcome to Seedify!</p>
                  <p className="text-sm text-gray-400">Ask me to create a prediction market or explain how it works.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                          : 'bg-white/20 backdrop-blur-md text-white border border-white/10'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.sender === 'bot' && (
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere"
                            dangerouslySetInnerHTML={{ __html: formatMessageWithLinks(message.text) }}
                          />
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        {message.sender === 'user' && (
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/20 backdrop-blur-md px-4 py-3 rounded-2xl overflow-hidden max-w-xs lg:max-w-md border border-white/10 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-white/10 p-4 bg-white/5 backdrop-blur-sm">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 bg-white/10 backdrop-blur-md text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 border border-white/20 transition-all duration-300"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-300 text-sm">
          <p className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Powered by Seedify • Create and Trade Prediction Markets
            <Sparkles className="w-4 h-4" />
          </p>
        </footer>
      </div>

      {/* Markets Modal */}
      {showMarkets && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-white/20">
            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Seedify Markets</h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => fetchMarkets(false)}
                  disabled={marketsLoading}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 px-3 py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  title="Refresh markets"
                >
                  {marketsLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowMarkets(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {marketsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : markets.length === 0 ? (
                <div className="text-center py-12 text-gray-300">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
                    <BarChart3 className="w-10 h-10" />
                  </div>
                  <p className="text-lg">No markets available yet. Be the first to create one!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {markets.map((market) => (
                    <div key={market.id} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Market #{market.id}</h3>
                          <p className="text-gray-200">{market.question}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium shadow-lg ${
                          market.resolved
                            ? 'bg-gray-600 text-white'
                            : market.winningOutcome === true
                              ? 'bg-green-500 text-white'
                              : market.winningOutcome === false
                                ? 'bg-red-500 text-white'
                                : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                        }`}>
                          {market.resolved
                            ? `Resolved: ${market.winningOutcome ? 'Yes' : 'No'}`
                            : 'Active'
                          }
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="flex items-center space-x-2 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                          <TrendingUp className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="text-xs text-gray-300">Yes Bets</p>
                            <p className="font-bold text-green-400">{market.totalYesBets} BNB</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                          <TrendingDown className="w-5 h-5 text-red-400" />
                          <div>
                            <p className="text-xs text-gray-300">No Bets</p>
                            <p className="font-bold text-red-400">{market.totalNoBets} BNB</p>
                          </div>
                        </div>
                      </div>
                      
                      {!market.resolved && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => openBetModal(market, 'yes')}
                              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                            >
                              <TrendingUp className="w-4 h-4" />
                              <span>Bet on Yes</span>
                            </button>
                            <button
                              onClick={() => openBetModal(market, 'no')}
                              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                            >
                              <TrendingDown className="w-4 h-4" />
                              <span>Bet on No</span>
                            </button>
                          </div>
                          <p className="text-xs text-gray-400 mt-2 text-center">
                            Or say: "Bet [amount] on Yes/No for market #{market.id}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bet Modal */}
      {showBetModal && selectedMarket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full border border-white/20">
            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Place Bet</h2>
              <button
                onClick={() => setShowBetModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                disabled={betLoading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-300 mb-1">Market</p>
                <p className="font-medium text-gray-100">{selectedMarket.question}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-300 mb-1">Your Bet</p>
                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium shadow-lg ${
                  betOutcome === 'yes'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                    : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                }`}>
                  {betOutcome === 'yes' ? (
                    <><TrendingUp className="w-4 h-4" /><span>Yes</span></>
                  ) : (
                    <><TrendingDown className="w-4 h-4" /><span>No</span></>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="betAmount" className="block text-sm font-medium text-gray-300 mb-2">
                  Bet Amount (BNB)
                </label>
                <input
                  id="betAmount"
                  type="number"
                  step="0.00001"
                  min="0.00001"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="0.00001"
                  className="w-full bg-white/10 backdrop-blur-md text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 border border-white/20 transition-all duration-300"
                  disabled={betLoading}
                />
              </div>
              
              {betError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                  <p className="text-sm text-red-300 whitespace-pre-wrap">{betError}</p>
                </div>
              )}
              
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-xs text-blue-300">
                  💡 **Before placing your bet:**
                </p>
                <ul className="text-xs text-blue-200 mt-1 space-y-1">
                  <li>• Ensure your wallet is unlocked and on BNB Testnet</li>
                  <li>• Check you have sufficient BNB for bet + gas fees</li>
                  <li>• Verify market is still active</li>
                  <li>• Review your bet amount carefully</li>
                </ul>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBetModal(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-all duration-300 border border-white/20"
                  disabled={betLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => placeBet(selectedMarket.id, betOutcome!, betAmount)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                  disabled={betLoading || transactionPending || !betAmount || parseFloat(betAmount) <= 0}
                >
                  {betLoading || transactionPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{transactionPending ? 'Transaction Pending...' : 'Placing Bet...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Place Bet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
      }