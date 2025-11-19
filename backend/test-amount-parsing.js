// Test script for the amount parsing logic
// This simulates the extractAndValidateAmount function

function extractAndValidateAmount(message) {
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

// Test cases
const testCases = [
  { message: "bet 0.00001 BNB on yes for market 1", expected: "0.00001" },
  { message: "place a bet of 1.5 ETH on no for market 2", expected: "1.5" },
  { message: "wager 100 USDC on yes for market 3", expected: "100" },
  { message: "bet 0.5 MATIC on no for market 4", expected: "0.5" },
  { message: "bet invalid BNB on yes for market 5", expected: null },
  { message: "bet -1 ETH on yes for market 6", expected: null },
  { message: "bet 0 BNB on yes for market 7", expected: null },
  { message: "bet 1.23456789 USDT on no for market 8", expected: "1.23456789" },
  { message: "bet 0.00000001 BNB on yes for market 9", expected: "0.00000001" }
];

console.log("Testing amount parsing logic:\n");

testCases.forEach((testCase, index) => {
  const result = extractAndValidateAmount(testCase.message);
  const passed = result.amount === testCase.expected && result.isValid === (testCase.expected !== null);
  
  console.log(`Test ${index + 1}: ${passed ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`  Message: "${testCase.message}"`);
  console.log(`  Expected: ${testCase.expected}`);
  console.log(`  Got: ${result.amount} (valid: ${result.isValid})`);
  console.log("");
});