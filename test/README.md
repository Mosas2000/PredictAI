# PredictionMarket Tests

This directory contains comprehensive tests for the PredictionMarket smart contract.

## Test Coverage

The test suite covers the following functionality:

### Market Creation
- Creating a market with correct details
- Incrementing market IDs for each new market
- Authorization checks (only owner can create markets)

### Placing Bets
- Placing Yes bets
- Placing No bets
- Multiple bets from the same user
- Both Yes and No bets from the same user
- Edge cases (zero bet amounts, non-existent markets, resolved markets)

### Market Resolution
- Resolving markets with Yes as winner
- Resolving markets with No as winner
- Authorization checks (only owner can resolve markets)
- Edge cases (non-existent markets, already resolved markets, markets without bets)

### Claiming Winnings
- Winners claiming their winnings
- Multiple winners claiming
- Edge cases (no winnings, already claimed, non-existent markets, unresolved markets)

### Edge Cases
- Betting on resolved markets
- Single winner scenarios
- Equal Yes and No pools
- Very small bets
- Multiple markets

## Running the Tests

To run the tests, you need to install the dependencies first:

```bash
npm install
```

Then run the tests using Hardhat:

```bash
npm test
```

Or directly with Hardhat:

```bash
npx hardhat test
```

## Test Structure

The tests are organized using Mocha's `describe` and `it` functions:

- `describe("PredictionMarket", function ()` - Main test suite
- Nested `describe` blocks for each major functionality
- `it` blocks for individual test cases
- `beforeEach` hooks to set up test state

## Assertions

The tests use Chai for assertions:

- `expect()` for value comparisons
- `.to.equal()` for exact matches
- `.to.be.true/false` for boolean checks
- `.to.be.gt()` for greater than comparisons
- `.to.be.revertedWith()` for error message checks

## Contract Interaction

The tests interact with the contract using:

- `ethers.getContractFactory()` to get the contract factory
- `contract.deploy()` to deploy a new instance
- `contract.connect(signer)` to change the calling account
- `contract.functions.methodName()` to call contract methods
- Event emission checks using transaction receipts

## Test Data

The tests use realistic test data:

- ETH amounts using `ethers.utils.parseEther()`
- Multiple user accounts for testing interactions
- Various market questions and scenarios
