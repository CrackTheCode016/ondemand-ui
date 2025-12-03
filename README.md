# EduChain Dashboard

A comprehensive dashboard for EduChain operations including OnDemand block ordering and reserve transfers, built with `polkadot-api` and Vue.js.

## About EduChain Dashboard

EduChain Dashboard is a comprehensive interface for managing EduChain (Para 4883) operations on the Polkadot ecosystem. It provides essential tools for:

### Network Monitoring
Real-time network statistics and connection status for EduChain. For detailed block information and transaction history, visit the full block explorer at [dev.papi.how](https://dev.papi.how).

### OnDemand Coretime
OnDemand coretime allows EduChain to purchase individual blocks of execution time on Polkadot without needing a full core. This is particularly useful for:

- **Educational Testing**: Test blockchain functionality in educational environments
- **Cost-Effective Learning**: Students and educators can experiment without long-term commitments
- **Flexible Development**: Quick iteration cycles for educational blockchain projects
- **Resource Management**: Pay only for the computational resources actually used

### Cross-Chain Asset Management
Seamlessly transfer assets between EduChain and AssetHub using reserve-based transfers powered by XCM (Cross-Consensus Messaging).

## Key Features

### 🔐 **Dual Signing Modes**
- **Wallet Mode**: Standard wallet integration via Talisman Connect for production use
- **Development Mode**: Direct mnemonic signing that bypasses wallet prompts for faster development

### 🤖 **Auto-Ordering Options**
- **Interval Mode**: Automatically place orders at configurable time intervals (5-3600 seconds)
- **Finalization Mode**: Place new orders automatically when the previous block finalizes

### � **Reserve Transfers**
- **Cross-chain transfers**: Move tokens between parachains and AssetHub using XCM
- **Bidirectional**: Support for both parachain-to-AssetHub and AssetHub-to-parachain transfers
- **Dual signing modes**: Works with both wallet and development signing modes

### �📊 **Real-time Monitoring**
- Live transaction status updates
- Order count tracking
- Block finalization monitoring
- Comprehensive error handling

## How It Works

### Basic Order Placement
1. **Connect**: Use wallet mode or configure development mode with your mnemonic
2. **Configure**: Set Para ID, max amount in PAS tokens, and safety preferences
3. **Submit**: Place individual orders or enable auto-ordering

### OnDemand Extrinsics
The application uses two main Paseo chain extrinsics:

- **`place_order_keep_alive`**: Creates an order while ensuring your account balance stays above the existential deposit
- **`place_order_allow_death`**: Creates an order that may reap your account if balance goes too low

### Signing Modes

#### 🔓 **Wallet Mode** (Production)
- Connects to your browser wallet (SubWallet, Talisman, etc.)
- Each transaction requires wallet approval
- Full security with user confirmation for every order

#### 🚧 **Development Mode** (Testing)
- Direct signing with mnemonic phrase
- Bypasses wallet prompts for rapid testing
- Ideal for automated testing and development workflows
- **⚠️ Use only with test accounts on testnets**

### Auto-Ordering Modes

#### ⏰ **Interval Mode**
- Places orders at regular time intervals
- Configurable from 5 seconds to 1 hour
- Perfect for stress testing and continuous block production

#### 🎯 **Finalization Mode**  
- Monitors the chain for block finalization events
- Places a new order immediately when the previous block finalizes
- Ensures maximum block production efficiency

## Quick Start

1. Enable **🚧 Development Mode** checkbox, or use your wallet of choice
2. Enter your test mnemonic (12-24 words)
3. Click "Set Context" to configure the signer
4. Enable auto-ordering for continuous testing
5. Monitor results in real-time

## Safety Notes

- **Development Mode**: Only use test mnemonics on testnets like Paseo
- **Keep Alive**: Always recommended to prevent account reaping
- **Max Amount**: Set reasonable limits to avoid unexpected costs
- **Auto-Ordering**: Monitor carefully as it will continue placing orders until stopped

## 🔗 SDK Information

This template uses **PAPI (Polkadot API)** - a modern, type-safe SDK for interacting with Polkadot-based blockchains.

📚 **PAPI Documentation**: https://papi.how/


## 🛠️ Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/     # Vue components
├── composables/    # Vue composition functions
├── utils/          # Utility functions and SDK setup
├── descriptors/    # Chain descriptors
├── style.css       # Global styles
└── App.vue         # Main application component
```

## 🔧 Adding Custom Networks

### Step 1: Generate Chain Descriptors

PAPI requires type descriptors for each chain. Generate them using the PAPI CLI:

```bash
# Add a new chain using a WebSocket endpoint
npx papi add your_chain -w wss://your-rpc-endpoint.io

# Or use a well-known chain name
npx papi add kusama -n ksmcc3

# Generate descriptors (automatically runs on postinstall)
npx papi
```

This creates type-safe descriptors in `@polkadot-api/descriptors` that you can import.

### Step 2: Configure Your Chain

Edit `src/utils/sdk.ts` to add your chain configuration:

```typescript
import { yourChain } from '@polkadot-api/descriptors'

const CONFIG = {
  // ... existing chains
  your_chain: {
    descriptor: yourChain,
    providers: ['wss://your-rpc-endpoint.io'],
  },
}
```

You can add multiple RPC endpoints for fallback support:

```typescript
const CONFIG = {
  dot: {
    descriptor: polkadot,
    providers: [
      'wss://rpc.polkadot.io',
      'wss://polkadot-rpc.dwellir.com'
    ],
  },
}
```

📖 For more details, see the [PAPI Codegen documentation](https://papi.how/codegen).

## � Attribution

The reserve transfer functionality is based on the excellent work by Francisco Aguirre:
- **XCM Transfer Implementation**: https://github.com/franciscoaguirre/dot-reserve-change/blob/main/transfers.ts
- Original implementation demonstrates proper XCM message structure for reserve-based transfers between chains

## �📚 Learn More

- [Vue 3 Documentation](https://vuejs.org/guide/typescript/overview.html#project-setup)
- [PAPI Documentation](https://papi.how/)
- [Polkadot Developer Portal](https://wiki.polkadot.network/)
- [XCM Documentation](https://wiki.polkadot.network/docs/learn/xcm/)
