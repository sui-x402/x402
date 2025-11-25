# x402-fetch

A utility package that extends the native `fetch` API to automatically handle 402 Payment Required responses using the x402 payment protocol. This is a Sui-supported fork of Coinbase x402 Payment Protocol. This package enables seamless integration of payment functionality into your applications when making HTTP requests.

## Installation

```bash
npm install x402-fetch
```

## Quick Start

```typescript
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { wrapFetchWithPayment } from "@nautic/x402-fetch";

// Create a Sui signer from your private key
const { secretKey } = decodeSuiPrivateKey("suiprivkey1...");
const keypair = Ed25519Keypair.fromSecretKey(secretKey);

// Wrap the fetch function with payment handling
const fetchWithPay = wrapFetchWithPayment(fetch, keypair);

// Make a request that may require payment
const response = await fetchWithPay("https://api.example.com/paid-endpoint", {
  method: "GET",
});

const data = await response.json();
```

## API

### `wrapFetchWithPayment(fetch, walletClient, maxValue?, paymentRequirementsSelector?)`

Wraps the native fetch API to handle 402 Payment Required responses automatically.

#### Parameters

- `fetch`: The fetch function to wrap (typically `globalThis.fetch`)
- `walletClient`: The wallet client used to sign payment messages (must implement the x402 wallet interface)
- `maxValue`: Optional maximum allowed payment amount in base units (defaults to 0.1 USDC)
- `paymentRequirementsSelector`: Optional function to select payment requirements from the response (defaults to `selectPaymentRequirements`)

#### Returns

A wrapped fetch function that automatically handles 402 responses by:

1. Making the initial request
2. If a 402 response is received, parsing the payment requirements
3. Verifying the payment amount is within the allowed maximum
4. Creating a payment header using the provided wallet client
5. Retrying the request with the payment header

## Example

```typescript
import { config } from "dotenv";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { wrapFetchWithPayment } from "@nautic/x402-fetch";

config();

const { SUI_PRIVATE_KEY, API_URL } = process.env;

// Create signer from private key (supports 'suiprivkey...' format)
const { secretKey } = decodeSuiPrivateKey(SUI_PRIVATE_KEY);
const keypair = Ed25519Keypair.fromSecretKey(secretKey);

const fetchWithPay = wrapFetchWithPayment(fetch, keypair);

// Make a request to a paid API endpoint
fetchWithPay(API_URL, {
  method: "GET",
})
  .then(async response => {
    const data = await response.json();
    console.log(data);
  })
  .catch(error => {
    console.error(error);
  });
```
