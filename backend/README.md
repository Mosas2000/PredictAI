# Seedify Backend Server

This is the backend server for the Seedify project, built with Node.js, Express, and TypeScript.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your actual API keys and configuration.

## Development

Run the server in development mode:
```bash
npm run dev
```

## Production

Build the TypeScript code:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## API Endpoints

### POST /api/chat

Accepts user messages and returns a response from Claude AI, configured as a prediction market assistant.

Request body:
```json
{
  "message": "Your message here"
}
```

Response:
```json
{
  "message": "Claude AI's response to your message",
  "timestamp": "2023-11-16T14:15:00.000Z"
}
```

### GET /health

Health check endpoint.

Response:
```json
{
  "status": "OK",
  "timestamp": "2023-11-16T14:15:00.000Z"
}
```

## Environment Variables

- `PORT`: Server port (default: 3001)
- `API_KEY`: Your API key
- `ANTHROPIC_API_KEY`: Your Anthropic API key for Claude AI integration
- `ETHEREUM_RPC_URL`: Ethereum RPC URL
- `PRIVATE_KEY`: Your private key
- `NODE_ENV`: Environment (development/production)