import {Keypair, PublicKey} from "@solana/web3.js"
import * as anchor from "@coral-xyz/anchor"
import { getAssociatedTokenAddressSync, createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";


export interface GetValsReturn {
    buyerTokenATA: PublicKey;
    buyerShareATA: PublicKey;
    configVault: PublicKey;
    propertyVault: PublicKey;
    property: PublicKey;
    propertyToken: PublicKey;
    config: PublicKey;
    payer: Keypair;
    buyer: Keypair;
    ID: anchor.BN;
    paymentTokens: Keypair,
    shareTokens: Keypair
}

export interface MintTokenArgs {
    connection: anchor.web3.Connection,
    paymentTokens: Keypair, 
    shareTokens: Keypair, 
    config: PublicKey, 
    property: PublicKey, 
    payer: Keypair,
    buyer: Keypair,
    amount: number
}

export async function mintingTokens({connection,paymentTokens, shareTokens, config, property, payer, buyer, amount}: MintTokenArgs) { 

    await createMint(connection, payer, config, null, 6, paymentTokens, null, anchor.workspace.IbicashBondingCurve)
    await createMint(connection, payer, property, null, 6, shareTokens, null, anchor.workspace.IbicashBondingCurve)    

    await getOrCreateAssociatedTokenAccount(connection, buyer, paymentTokens.publicKey, config, true)
    await getOrCreateAssociatedTokenAccount(connection, buyer, shareTokens.publicKey, property, true)

    await mintTo(
        connection, 
        payer,
        paymentTokens.publicKey,
        buyer.publicKey,
        config,
        100
    )
}


export async function getVals(connection: anchor.web3.Connection): Promise<GetValsReturn> {
    const payer = Keypair.generate();
    const ID = new anchor.BN(1)
    const paymentToken = Keypair.generate();
    const buyer = Keypair.generate();
    const paymentTokens = Keypair.generate();
    const shareTokens = Keypair.generate();

    const sig1 = await connection.requestAirdrop(payer.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL)
    const sig2 = await connection.requestAirdrop(buyer.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL)

    await connection.confirmTransaction(sig1);
    await connection.confirmTransaction(sig2);

    const config = PublicKey.findProgramAddressSync([
        Buffer.from("config")
    ],
    anchor.workspace.IbicashBondingCurve
    )[0]

    const property = PublicKey.findProgramAddressSync([
        Buffer.from("property"),
        payer.publicKey.toBuffer(),
        ID.toArrayLike(Buffer, "le", 8)
    ],
    anchor.workspace.IbicashBondingCurve
    )[0]

    const propertyToken = PublicKey.findProgramAddressSync([
        Buffer.from("property_token"),
        payer.publicKey.toBuffer(),
        ID.toArrayLike(Buffer, "le", 8)
    ],
    anchor.workspace.IbicashBondingCurve
    )[0]


    const buyerTokenATA = getAssociatedTokenAddressSync(propertyToken, buyer.publicKey);
    const buyerShareATA = getAssociatedTokenAddressSync(paymentToken.publicKey, buyer.publicKey);
    
    const configVault = getAssociatedTokenAddressSync(paymentToken.publicKey, config);
    const propertyVault = getAssociatedTokenAddressSync(propertyToken, property);
    
    return {
        buyerTokenATA,
        buyerShareATA,
        configVault,
        propertyVault,
        property,
        propertyToken,
        config, 
        payer, 
        buyer,
        ID,
        paymentTokens,
        shareTokens
    }
}


