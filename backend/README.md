# Seedify Backend

Express server with Groq integration for the prediction market chat interface.

## Setup

```bash
npm install
cp .env.example .env  # fill in your keys
npm run dev
```

## Endpoints

- `POST /api/chat` — send a message, get a response
- `GET /health` — health check

## Env Vars

- `PORT` — server port (default 3001)
- `GROQ_API_KEY` — Groq API key
- `ETHEREUM_RPC_URL` — RPC endpoint
- `CONTRACT_ADDRESS` — deployed contract address
- `PRIVATE_KEY` — deployer wallet key
