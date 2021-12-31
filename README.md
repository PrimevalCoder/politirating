# Celo dApp: Politirating
## Description
This is a sample app that demonstrates Solidity features with Celo. It allows users to rate their favorite politicians on-chain. Only the owner can add new politicians.
![](https://github.com/PrimevalCoder/my-storage/blob/master/ss%20politirating.png?raw=true)

## Live Demo
[Politirating](https://primevalcoder.github.io/politirating/)

## Usage

### Requirements
1. Install the [CeloExtensionWallet](https://chrome.google.com/webstore/detail/celoextensionwallet/kkilomkmpmkbdnfelcpgckmpcaemjcdh?hl=en) from the Google Chrome Store.
2. Create a wallet.
3. Go to [https://celo.org/developers/faucet](https://celo.org/developers/faucet) and get tokens for the Alfajores testnet. Make sure your balance shows the tokens.
4. Switch to the Alfajores testnet in the CeloExtensionWallet.

### Test
1. If using the provided live demo, just choose your favorite politician, pick a rating, and click "Vote". Next, you should approve the contract to access your funds, then make the payment (1 cUSD required per vote).
2. If you're setting up your own version of the dApp, you can also add new politicians from the owner address. 


## Project Setup

### Install
```
npm install
```

### Start
```
npm run dev
```

### Build
```
npm run build
