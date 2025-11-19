const Groq = require('groq-sdk');
require('dotenv').config();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function testGroqIntegration() {
  try {
    console.log('Testing Groq AI integration...');
    
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

Always be helpful, clear, and concise. Avoid technical jargon when possible, but explain blockchain concepts when relevant.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: "What is a prediction market and how does it work?"
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    console.log('✅ Groq AI integration test successful!');
    console.log('Response:', chatCompletion.choices[0]?.message?.content);
  } catch (error) {
    console.error('❌ Groq AI integration test failed:', error.message);
  }
}

testGroqIntegration();