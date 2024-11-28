import {Keypair, PublicKey} from "@solana/web3.js"
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
    configOwner: PublicKey, 
    propertyOwner: PublicKey, 
    payer: Keypair,
    buyer: Keypair,
    amount: number,
    buyerTokenATA: PublicKey,
    programId: PublicKey
}

export async function mintingTokens({connection,paymentTokens, shareTokens, configOwner, propertyOwner, payer, buyer, amount, buyerTokenATA, programId}: MintTokenArgs) { 

    await createMint(connection, payer, configOwner, null, 6, paymentTokens, null, programId)
    await createMint(connection, payer, propertyOwner, null, 6, shareTokens, null, programId)    

    await getOrCreateAssociatedTokenAccount(connection, buyer, paymentTokens.publicKey, configOwner, true)
    await getOrCreateAssociatedTokenAccount(connection, buyer, shareTokens.publicKey, propertyOwner, true)

    await mintTo(
        connection, 
        payer,
        paymentTokens.publicKey,
        getAssociatedTokenAddressSync(paymentTokens.publicKey, buyer.publicKey, true),
        configOwner,
        1000
    )
}


export async function getVals(connection: anchor.web3.Connection, programId: PublicKey): Promise<GetValsReturn> {
    const protocolOwner = Keypair.generate();
    const ID = new anchor.BN(1)
    const paymentToken = Keypair.generate();
    const buyer = Keypair.generate();
    const paymentTokens = Keypair.generate();
    const shareTokens = Keypair.generate();
    const propertyOwner = Keypair.generate();

    const sig1 = await connection.requestAirdrop(protocolOwner.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL)
    const sig2 = await connection.requestAirdrop(buyer.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL)
    const sig3 = await connection.requestAirdrop(propertyOwner.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL)

    await connection.confirmTransaction(sig1);
    await connection.confirmTransaction(sig2);
    await connection.confirmTransaction(sig3);

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
        Buffer.from("property_token"),
        propertyOwner.publicKey.toBuffer(),
        ID.toArrayLike(Buffer, "le", 8)
    ],
    programId
    )[0]


    const buyerTokenATA = getAssociatedTokenAddressSync(propertyToken, buyer.publicKey);
    const buyerShareATA = getAssociatedTokenAddressSync(paymentToken.publicKey, buyer.publicKey);
    
    const configVault = getAssociatedTokenAddressSync(paymentToken.publicKey, protocolOwner.publicKey);
    const propertyVault = getAssociatedTokenAddressSync(propertyToken, propertyOwner.publicKey);
    
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