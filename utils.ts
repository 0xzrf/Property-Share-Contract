import {Keypair, PublicKey, Signer} from "@solana/web3.js"
import * as anchor from "@coral-xyz/anchor"
import { getAssociatedTokenAddressSync, createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

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
    paymentTokens: Keypair,
    shareTokens: Keypair
}

export interface MintTokenArgs {
    connection: anchor.web3.Connection,
    paymentTokens: Keypair, 
    shareTokens: Keypair, 
    configOwner: Signer, 
    property: PublicKey, 
    payer: Keypair,
    buyer: Keypair,
    amount: number,
    buyerTokenATA: PublicKey,
    programId: PublicKey,
    destinationATA: PublicKey
}

export async function mintingTokens({connection,paymentTokens, shareTokens, configOwner, property, payer, buyer, amount}: MintTokenArgs) { 
    await createMint(connection, payer, configOwner.publicKey, null, 6, paymentTokens)
    
    const buyerPaymentATA = await getOrCreateAssociatedTokenAccount(connection, buyer, paymentTokens.publicKey, buyer.publicKey, false)

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
    const protocolOwner = Keypair.generate();
    const ID = new anchor.BN(1)
    const buyer = Keypair.generate();
    const paymentTokens = Keypair.generate();
    const shareTokens = Keypair.generate();
    const propertyOwner = Keypair.generate();

    await connection.confirmTransaction(await connection.requestAirdrop(protocolOwner.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL));
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


    const buyerTokenATA = getAssociatedTokenAddressSync(propertyToken, buyer.publicKey, true);
    const buyerShareATA = getAssociatedTokenAddressSync(paymentTokens.publicKey, buyer.publicKey, true);
    
    const configVault = getAssociatedTokenAddressSync(paymentTokens.publicKey,config, true);
    const propertyVault = getAssociatedTokenAddressSync(paymentTokens.publicKey, property, true);
    
    return {
        buyerTokenATA,
        buyerShareATA,
        configVault,
        propertyVault,
        property,
        propertyToken,
        config, 
        protocolOwner, 
        buyer,
        ID,
        paymentTokens,
        shareTokens,
        propertyOwner
    }
}