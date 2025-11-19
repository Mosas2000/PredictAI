#!/bin/bash

echo "Setting up PredictionMarket test environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm first."
    exit 1
fi

echo "Installing dependencies..."
npm install

echo "Compiling contracts..."
npx hardhat compile

echo "Running tests..."
npm test

echo "Setup complete! You can now run tests with 'npm test' or 'npx hardhat test'"