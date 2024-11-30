import {Keypair, PublicKey, Signer} from "@solana/web3.js"
import * as anchor from "@coral-xyz/anchor"
import { getAssociatedTokenAddressSync, createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
export const paymentTokens = Keypair.generate()
export const configOwner = Keypair.generate()
export interface GetValsReturn {
    buyerTokenATA: PublicKey; // buyer payment token ata
    buyerShareATA: PublicKey; // buyer share token ata
    configVault: PublicKey;
    propertyVault: PublicKey;
    property: PublicKey;
    propertyToken: PublicKey;
    config: PublicKey;
    propertyOwner: Keypair;
    protocolOwner: Keypair;
    buyer: Keypair;
    ID: anchor.BN;
    shareTokens: Keypair,
    withdrawDestinationATA: PublicKey
}

export interface MintTokenArgs {
    connection: anchor.web3.Connection,
    paymentTokens: Keypair, 
    configOwner: Signer, 
    payer: Keypair,
    buyer: Keypair,
    amount: number,
    buyerTokenATA: PublicKey,
    programId: PublicKey,
    destinationATA: PublicKey,
    createMnt: boolean
}

export async function mintingTokens({connection,paymentTokens, configOwner, payer, buyer, amount, createMnt}: MintTokenArgs) { 
    if (createMnt) {
        await createMint(connection, payer, configOwner.publicKey, null, 6, paymentTokens)
    }
    
    const buyerPaymentATA = await getOrCreateAssociatedTokenAccount(connection, buyer, paymentTokens.publicKey, buyer.publicKey, true)

    await mintTo(
        connection, 
        payer,
        paymentTokens.publicKey,    
        buyerPaymentATA.address,
        configOwner,
        amount * 10 ** 6
    )
}


export async function getVals(connection: anchor.web3.Connection, programId: PublicKey): Promise<GetValsReturn> {
    const ID = new anchor.BN(1)
    const buyer = Keypair.generate();
    const shareTokens = Keypair.generate();
    const propertyOwner = Keypair.generate();

    await connection.confirmTransaction(await connection.requestAirdrop(configOwner.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL));
    await connection.confirmTransaction(await connection.requestAirdrop(buyer.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL));
    await connection.confirmTransaction(await connection.requestAirdrop(propertyOwner.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL));

    const config = PublicKey.findProgramAddressSync([
        Buffer.from("config")
    ],
    programId
    )[0]

    const property = PublicKey.findProgramAddressSync([
        Buffer.from("property"),
        propertyOwner.publicKey.toBuffer(),
        ID.toArrayLike(Buffer, "le", 8)
    ],
    programId
    )[0]

    const propertyToken = PublicKey.findProgramAddressSync([
        Buffer.from("property_tokens"),
        propertyOwner.publicKey.toBuffer(),
        ID.toArrayLike(Buffer, "le", 8)
    ],
    programId
    )[0]


    const buyerTokenATA = getAssociatedTokenAddressSync(paymentTokens.publicKey, buyer.publicKey, true);
    const buyerShareATA = getAssociatedTokenAddressSync(propertyToken, buyer.publicKey, true);
    
    const configVault = getAssociatedTokenAddressSync(paymentTokens.publicKey,config, true);
    const propertyVault = getAssociatedTokenAddressSync(paymentTokens.publicKey, property, true);

    const withdrawDestinationATA = getAssociatedTokenAddressSync(paymentTokens.publicKey, configOwner.publicKey, true);
    
    
    return {
        buyerTokenATA,
        buyerShareATA,
        configVault,
        propertyVault,
        property,
        propertyToken,
        config, 
        protocolOwner: configOwner, 
        buyer,
        ID,
        shareTokens,
        propertyOwner,
        withdrawDestinationATA
    }
}