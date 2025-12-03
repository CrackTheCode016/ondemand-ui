import { ref } from 'vue'
import { polkadotSigner } from '~/utils/sdk-interface'
import { useConnect } from './useConnect'
import sdk from '~/utils/sdk'
import { FixedSizeBinary } from 'polkadot-api'
import {
    XcmV3Junction,
    XcmV3Junctions,
    XcmV3MultiassetFungibility,
    XcmV3WeightLimit,
    XcmV4AssetAssetFilter,
    XcmV4AssetWildAsset,
    XcmV4Instruction,
    XcmVersionedXcm
} from '~/descriptors'
import { ss58Decode } from '@polkadot-labs/hdkd-helpers'

export function useReserveTransfer() {
    const { selectedAccount } = useConnect()

    const isProcessing = ref(false)
    const result = ref('')
    const txHash = ref('')



    // Reserve transfer from Parachain to AssetHub  
    const fromParachainToAssetHub = async (transferAmountTokens: number, beneficiaryAddress: string) => {
        isProcessing.value = true
        result.value = ''
        txHash.value = ''

        try {
            const signer = await polkadotSigner()
            if (!signer || !selectedAccount.value) {
                result.value = 'No wallet connected'
                isProcessing.value = false
                return
            }

            result.value = `Transferring ${transferAmountTokens} PAS to AssetHub...`

            createParachainToAssetHubTransfer(transferAmountTokens, beneficiaryAddress, signer, {
                onTxHash: (hash: string) => {
                    txHash.value = hash
                },
                onFinalized: () => {
                    result.value = 'Transfer completed!'
                    isProcessing.value = false
                },
                onError: (error: string) => {
                    result.value = `Error: ${error}`
                    isProcessing.value = false
                },
            })
        } catch (err) {
            result.value = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
            isProcessing.value = false
        }
    }

    // Reserve transfer from AssetHub to Parachain
    const fromAssetHubToParachain = async (transferAmountTokens: number, beneficiaryAddress: string) => {
        isProcessing.value = true
        result.value = ''
        txHash.value = ''

        try {
            const signer = await polkadotSigner()
            if (!signer || !selectedAccount.value) {
                result.value = 'No wallet connected'
                isProcessing.value = false
                return
            }

            result.value = `Transferring ${transferAmountTokens} PAS to Educhain...`

            createAssetHubToParachainTransfer(transferAmountTokens, beneficiaryAddress, signer, {
                onTxHash: (hash: string) => {
                    txHash.value = hash
                },
                onFinalized: () => {
                    result.value = 'Transfer completed!'
                    isProcessing.value = false
                },
                onError: (error: string) => {
                    result.value = `Error: ${error}`
                    isProcessing.value = false
                },
            })
        } catch (err) {
            result.value = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
            isProcessing.value = false
        }
    }

    return {
        // State
        isProcessing,
        result,
        txHash,

        // Methods
        fromParachainToAssetHub,
        fromAssetHubToParachain,
    }
}

// Helper function for Parachain to AssetHub transfer
export function createParachainToAssetHubTransfer(
    transferAmountTokens: number,
    beneficiaryAddress: string,
    signer: any,
    callbacks: {
        onTxHash: (hash: string) => void
        onFinalized: () => void
        onError: (error: string) => void
    },
) {
    const { api } = sdk('educhain') // Use Educhain RPC endpoint

    // Convert tokens to smallest unit (assuming 10 decimals for PAS tokens)
    const transferAmount = BigInt(Math.floor(transferAmountTokens * 10 ** 10))

    // Convert beneficiary address string to bytes (SS58 to AccountId32)
    const beneficiaryBytes = FixedSizeBinary.fromBytes(ss58Decode(beneficiaryAddress)[0])

    // Create XCM transaction using the proper structure from your example
    const tx = api.tx.PolkadotXcm.execute({
        message: XcmVersionedXcm.V5([
            XcmV4Instruction.WithdrawAsset([{
                id: { parents: 1, interior: XcmV3Junctions.Here() },
                fun: XcmV3MultiassetFungibility.Fungible(transferAmount),
            }]),
            XcmV4Instruction.InitiateReserveWithdraw({
                assets: XcmV4AssetAssetFilter.Wild(XcmV4AssetWildAsset.AllCounted(1)),
                reserve: { parents: 1, interior: XcmV3Junctions.X1(XcmV3Junction.Parachain(1000)) }, // AssetHub
                xcm: [
                    XcmV4Instruction.BuyExecution({
                        fees: {
                            id: { parents: 1, interior: XcmV3Junctions.Here() },
                            fun: XcmV3MultiassetFungibility.Fungible(transferAmount / 2n),
                        },
                        weight_limit: XcmV3WeightLimit.Unlimited(),
                    }),
                    XcmV4Instruction.DepositAsset({
                        assets: XcmV4AssetAssetFilter.Wild(XcmV4AssetWildAsset.AllCounted(1)),
                        beneficiary: { parents: 0, interior: XcmV3Junctions.X1(XcmV3Junction.AccountId32({ network: undefined, id: beneficiaryBytes })) }
                    }),
                ],
            }),
        ]),
        max_weight: { ref_time: 2_000_000_000n, proof_size: 200_000n },
    })


    console.log('Submitting Parachain to AssetHub transfer transaction:', tx.decodedCall)

    const unsub = tx.signSubmitAndWatch(signer).subscribe({
        next: (event: any) => {
            if (event.type === 'txBestBlocksState' && event.found) {
                callbacks.onTxHash(event.txHash)
            }

            if (event.type === 'finalized') {
                callbacks.onFinalized()
                unsub.unsubscribe()
            }
        },
        error: (err: any) => {
            unsub.unsubscribe()
            console.error(err)
            callbacks.onError(err.message || 'Unknown error')
        },
    })
}

// Helper function for AssetHub to Parachain transfer
export function createAssetHubToParachainTransfer(
    transferAmountTokens: number,
    beneficiaryAddress: string,
    signer: any,
    callbacks: {
        onTxHash: (hash: string) => void
        onFinalized: () => void
        onError: (error: string) => void
    },
) {
    const { api } = sdk('pas_asset_hub') // Use Paseo AssetHub

    // Convert tokens to smallest unit (assuming 10 decimals for PAS tokens)
    const transferAmount = BigInt(Math.floor(transferAmountTokens * 10 ** 10))

    // Convert beneficiary address string to bytes (SS58 to AccountId32)
    const beneficiaryBytes = FixedSizeBinary.fromBytes(ss58Decode(beneficiaryAddress)[0])

    // Create XCM transaction for AssetHub to Parachain using proper structure
    const tx =
        api.tx.PolkadotXcm.execute({
            message: XcmVersionedXcm.V4([
                XcmV4Instruction.WithdrawAsset([{
                    id: { parents: 1, interior: XcmV3Junctions.Here() },
                    fun: XcmV3MultiassetFungibility.Fungible(transferAmount),
                }]),
                XcmV4Instruction.DepositReserveAsset({
                    assets: XcmV4AssetAssetFilter.Wild(XcmV4AssetWildAsset.AllCounted(1)),
                    dest: { parents: 1, interior: XcmV3Junctions.X1(XcmV3Junction.Parachain(4883)) }, // Fixed to Educhain
                    xcm: [
                        XcmV4Instruction.BuyExecution({
                            fees: {
                                id: { parents: 1, interior: XcmV3Junctions.Here() },
                                fun: XcmV3MultiassetFungibility.Fungible(transferAmount / 2n),
                            },
                            weight_limit: XcmV3WeightLimit.Unlimited(),
                        }),
                        XcmV4Instruction.DepositAsset({
                            assets: XcmV4AssetAssetFilter.Wild(XcmV4AssetWildAsset.AllCounted(1)),
                            beneficiary: { parents: 0, interior: XcmV3Junctions.X1(XcmV3Junction.AccountId32({ network: undefined, id: beneficiaryBytes })) }
                        }),
                    ],
                }),
            ]),
            max_weight: { ref_time: 2_000_000_000n, proof_size: 200_000n },
        })

    const unsub = tx.signSubmitAndWatch(signer).subscribe({
        next: (event: any) => {
            if (event.type === 'txBestBlocksState' && event.found) {
                callbacks.onTxHash(event.txHash)
            }

            if (event.type === 'finalized') {
                callbacks.onFinalized()
                unsub.unsubscribe()
            }
        },
        error: (err: any) => {
            unsub.unsubscribe()
            console.error(err)
            callbacks.onError(err.message || 'Unknown error')
        },
    })
}