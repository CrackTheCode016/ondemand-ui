import type { PolkadotSigner } from "polkadot-api";
import { entropyToMiniSecret, mnemonicToEntropy, ss58Address } from "@polkadot-labs/hdkd-helpers";
import { sr25519CreateDerive } from "@polkadot-labs/hdkd";
import { getPolkadotSigner } from "polkadot-api/signer";

/**
 * Development utilities for private key handling
 * WARNING: This is for development use only. Never use this in production!
 */

export interface DevAccount {
  mnemonic: string
  address: string
  signer: PolkadotSigner
}

/**
 * Validate if a string looks like a mnemonic
 */
export function isValidMnemonic(mnemonic: string): boolean {
  const words = mnemonic.trim().split(/\s+/)
  return words.length >= 12 && words.length <= 24 && words.length % 3 === 0
}

/**
 * Extracts a Polkadot signer from the provided mnemonic.
 * This is the same pattern as your CoretimeOrderingStrategy example.
 * @param mnemonic - The mnemonic used to derive the signer.
 * @returns A PolkadotSigner instance derived from the mnemonic.
 */
export function extractSigner(mnemonic: string): PolkadotSigner {
  const entropy = mnemonicToEntropy(mnemonic);
  const miniSecret = entropyToMiniSecret(entropy)
  const derive = sr25519CreateDerive(miniSecret)
  return getPolkadotSigner(
    derive('').publicKey,
    "Sr25519",
    (input) => derive('').sign(input)
  );
}


/**
 * Get account info from mnemonic with real signer
 */
export function getAccountFromMnemonic(mnemonic: string): DevAccount {
  if (!isValidMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase. Must be 12-24 words.')
  }
  
  try {
    const signer = extractSigner(mnemonic)
    const entropy = mnemonicToEntropy(mnemonic);
    const miniSecret = entropyToMiniSecret(entropy)
    const derive = sr25519CreateDerive(miniSecret)
    const publicKey = derive('').publicKey
    const address = ss58Address(publicKey)
    
    return {
      mnemonic,
      address,
      signer
    }
  } catch (error) {
    throw new Error(`Failed to create account from mnemonic: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}