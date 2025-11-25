# x402-axios

A utility package that extends Axios to automatically handle 402 Payment Required responses using the x402 payment protocol. This is a Sui-supported fork of Coinbase x402 Payment Protocol. This package enables seamless integration of payment functionality into your applications when making HTTP requests with Axios.

## Installation

```bash
npm install x402-axios
```

## Quick Start

```typescript
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { withPaymentInterceptor } from "@nautic/x402-axios";
import axios from "axios";

// Create a Sui signer from your private key
const { secretKey } = decodeSuiPrivateKey("suiprivkey1...");
const keypair = Ed25519Keypair.fromSecretKey(secretKey);

// Create an Axios instance with payment handling
const api = withPaymentInterceptor(
  axios.create({
    baseURL: "https://api.example.com",
  }),
  keypair,
);

// Make a request that may require payment
const response = await api.get("/paid-endpoint");
console.log(response.data);
```

## Features

- Automatic handling of 402 Payment Required responses
- Automatic retry of requests with payment headers
- Payment verification and header generation
- Exposes payment response headers

## API

### `withPaymentInterceptor(axiosClient, walletClient)`

Adds a response interceptor to an Axios instance to handle 402 Payment Required responses automatically.

#### Parameters

- `axiosClient`: The Axios instance to add the interceptor to
- `walletClient`: The wallet client used to sign payment messages (must implement the x402 wallet interface)

#### Returns

The modified Axios instance with the payment interceptor that will:

1. Intercept 402 responses
2. Parse the payment requirements
3. Create a payment header using the provided wallet client
4. Retry the original request with the payment header
5. Expose the X-PAYMENT-RESPONSE header in the final response
