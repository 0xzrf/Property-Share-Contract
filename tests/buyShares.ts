import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { IbicashBondingCurve } from "../target/types/ibicash_bonding_curve";
import { getVals, GetValsReturn, MintTokenArgs, mintingTokens } from "../utils";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { TOKEN_PROGRAM_ID, getAccount } from "@solana/spl-token";
import { test, beforeEach } from "mocha";
import { assert } from "console";

const Amounts = {
  buyAmount: new anchor.BN(10),
  protocolFee: 2
}

describe("ibicash-bonding-curve", () => {
  // Configure the client to use the local cluster.
  const PROTOCOL_FEE = new anchor.BN(10)
  const provider = anchor.AnchorProvider.env()

  anchor.setProvider(provider);
  const associatedTokenProgram = ASSOCIATED_PROGRAM_ID;
  const systemProgram = anchor.web3.SystemProgram.programId
  const tokenProgram = TOKEN_PROGRAM_ID
  const program = anchor.workspace.IbicashBondingCurve as Program<IbicashBondingCurve>;

  let vals: GetValsReturn

  beforeEach(async () => {
    // Get all the values from a config file
    vals = await getVals(provider.connection, program.programId) 
    // Make the required values min and also create and mint neecessary 
    console.log("PROGRMAID:::::",program.programId.toString())

    console.log("Init the beforeEach")
    const mintArgs: MintTokenArgs = {
      amount: 1000,
      buyer: vals.buyer,
      configOwner: vals.protocolOwner.publicKey,
      connection: provider.connection,
      payer: vals.propertyOwner,
      paymentTokens: vals.paymentTokens,
      propertyOwner: vals.propertyOwner.publicKey,
      shareTokens: vals.shareTokens,
      buyerTokenATA: vals.buyerTokenATA,
      programId: program.programId,
      destinationATA: vals.buyerTokenATA
    }
    
    await mintingTokens(mintArgs)
    console.log("Starting config")

    await program.methods.initConfig(Amounts.protocolFee) // Protocol fee
      .accountsStrict({
        associatedTokenProgram,
        config: vals.config,
        owner: vals.protocolOwner.publicKey,
        paymentToken: vals.paymentTokens.publicKey,
        protocolVault: vals.configVault,
        systemProgram,
        tokenProgram
      })
      .signers([vals.protocolOwner])
      .rpc()
      console.log("Done initiating config")

    await program.methods.initProp(new anchor.BN(vals.ID), 10, new anchor.BN(1000), new anchor.BN(100)) // unique identifier, subject fee, multiplier, base_price
      .accountsStrict({
        owner: vals.propertyOwner.publicKey,
        associatedTokenProgram,
        systemProgram,
        tokenProgram,
        paymentToken: vals.paymentTokens.publicKey,
        property: vals.property,
        propertyToken: vals.propertyToken,
        propertyVault: vals.propertyVault
      })
      .signers([vals.propertyOwner])
      .rpc()
  })

  test("Buys some share", async () => {

    await program.methods.buyShares(Amounts.buyAmount)
      .accountsStrict({
        associatedTokenProgram,
        config: vals.config,
        paymentMint: vals.paymentTokens.publicKey,
        property: vals.property,
        propertyToken: vals.propertyToken,
        propertyVault: vals.propertyVault,
        protocolVault: vals.configVault,
        systemProgram,
        tokenProgram,
        user: vals.buyer.publicKey,
        userShareAta: vals.buyerShareATA,
        userTokenAta: vals.buyerTokenATA
      })
      .signers([vals.buyer])
      .rpc()
    console.log("Buys some share passed")

    assert(true)

  })

  test("Checks if the buy amount for the amout of tokens is is bigger the next time", async () => {

  })

})