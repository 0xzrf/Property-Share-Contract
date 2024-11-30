import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { IbicashBondingCurve } from "../target/types/ibicash_bonding_curve";
import { getVals, GetValsReturn, MintTokenArgs, mintingTokens, paymentTokens } from "../utils";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { TOKEN_PROGRAM_ID, getAccount, getAssociatedTokenAddressSync, mintTo } from "@solana/spl-token";
import { test } from "mocha";
import { assert } from "console";
import { Keypair } from "@solana/web3.js";

const Amounts = {
  buyAmount: new anchor.BN(10),
  protocolFee: 2
}

describe("BUY INSTRUCT TESTING", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()

  anchor.setProvider(provider);
  const associatedTokenProgram = ASSOCIATED_PROGRAM_ID;
  const systemProgram = anchor.web3.SystemProgram.programId
  const tokenProgram = TOKEN_PROGRAM_ID
  const program = anchor.workspace.IbicashBondingCurve as Program<IbicashBondingCurve>;

  let vals: GetValsReturn;


  before(async () => {
    vals = await getVals(provider.connection, program.programId);

    console.log(vals.config.toString(), "VALS FROM BUY");

    const mintArgs: MintTokenArgs = {
      amount: 10000000000,
      buyer: vals.buyer,
      configOwner: vals.protocolOwner,
      connection: provider.connection,
      payer: vals.propertyOwner,
      paymentTokens: paymentTokens,
      buyerTokenATA: vals.buyerTokenATA,
      programId: program.programId,
      destinationATA: vals.buyerTokenATA,
      createMnt: true
    }

    await mintingTokens(mintArgs)
    // Initialize config once for all tests
    await program.methods.initConfig(Amounts.protocolFee)
      .accountsStrict({
        owner: vals.protocolOwner.publicKey,
        paymentToken: paymentTokens.publicKey,
        config: vals.config,
        protocolVault: vals.configVault,
        systemProgram,
        tokenProgram,
        associatedTokenProgram
      })
      .signers([vals.protocolOwner])
      .rpc()

    await program.methods.initProp(new anchor.BN(vals.ID), 10, new anchor.BN(1000), new anchor.BN(100)) // unique identifier, subject fee, multiplier, base_price
      .accountsStrict({
        owner: vals.propertyOwner.publicKey,
        property: vals.property,
        paymentToken: paymentTokens.publicKey,
        propertyVault: vals.propertyVault,
        propertyToken: vals.propertyToken,
        systemProgram,
        tokenProgram,
        associatedTokenProgram
      })
      .signers([vals.propertyOwner])
      .rpc()
    console.log("Done w/ before")
  });

  test("Buys some share", async () => {

    const userTokenATABefore = await getAccount(provider.connection, vals.buyerTokenATA)

    await program.methods.buyShares(Amounts.buyAmount)
      .accountsStrict({
        user: vals.buyer.publicKey,
        config: vals.config,
        protocolVault: vals.configVault,
        property: vals.property,
        paymentMint: paymentTokens.publicKey,
        propertyToken: vals.propertyToken,
        userTokenAta: vals.buyerTokenATA,
        userShareAta: vals.buyerShareATA,
        propertyVault: vals.propertyVault,
        systemProgram,
        tokenProgram,
        associatedTokenProgram
      })
      .signers([vals.buyer])
      .rpc()
    const userShareATAAfter = await getAccount(provider.connection, vals.buyerShareATA)
    const userTokenATAAfter = await getAccount(provider.connection, vals.buyerTokenATA)

    console.log("User token ATA before", userTokenATABefore.amount.toString(), "\nUser Token ATA After", userTokenATAAfter.amount.toString())
    console.log("diff:::", Number(userTokenATABefore.amount.toString()) - Number(userTokenATAAfter.amount.toString()))
    assert(userShareATAAfter.amount.toString() == String(Amounts.buyAmount))
  })

  test("The payment token increases for the same amount property shares", async () => {
    try {
      const userTokenATA1Before = await getAccount(provider.connection, vals.buyerTokenATA)
  
      await program.methods.buyShares(Amounts.buyAmount)
        .accountsStrict({
          user: vals.buyer.publicKey,
          config: vals.config,
          protocolVault: vals.configVault,
          property: vals.property,
          paymentMint: paymentTokens.publicKey,
          propertyToken: vals.propertyToken,
          userTokenAta: vals.buyerTokenATA,
          userShareAta: vals.buyerShareATA,
          propertyVault: vals.propertyVault,
          systemProgram,
          tokenProgram,
          associatedTokenProgram
        })
        .signers([vals.buyer])
        .rpc()
      const userTokenATA1After = await getAccount(provider.connection, vals.buyerTokenATA)
      
      const amount1 = Number(userTokenATA1Before.amount.toString()) - Number(userTokenATA1After.amount.toString())
      const userTokenATABefore = await getAccount(provider.connection, vals.buyerTokenATA)
  
      await program.methods.buyShares(Amounts.buyAmount)
        .accountsStrict({
          user: vals.buyer.publicKey,
          config: vals.config,
          protocolVault: vals.configVault,
          property: vals.property,
          paymentMint: paymentTokens.publicKey,
          propertyToken: vals.propertyToken,
          userTokenAta: vals.buyerTokenATA,
          userShareAta: vals.buyerShareATA,
          propertyVault: vals.propertyVault,
          systemProgram,
          tokenProgram,
          associatedTokenProgram
        })
        .signers([vals.buyer])
        .rpc()
      const userTokenATAAfter = await getAccount(provider.connection, vals.buyerTokenATA)
  
      const amount2 = Number(userTokenATABefore.amount.toString()) - Number(userTokenATAAfter.amount.toString())
  
        console.log("First time amount", amount1, "\nSecond time amount", amount2)
  
        assert(amount1 < amount2)
    }catch (err){
      console.error("An error occured",err);
      assert(false)
    }

  })

  test("Fails if the user has insufficient balance", async () => {
    const newBuyer = Keypair.generate();
    await provider.connection.confirmTransaction(await provider.connection.requestAirdrop(newBuyer.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL))

    const newBuyerTokenATA = getAssociatedTokenAddressSync(paymentTokens.publicKey, newBuyer.publicKey, true);
    const newBuyerShareATA = getAssociatedTokenAddressSync(vals.propertyToken, newBuyer.publicKey, true);

    await mintTo(
      provider.connection, 
      newBuyer,
      paymentTokens.publicKey,    
      newBuyerTokenATA,
      vals.protocolOwner,
      10 * 10 ** 6 // Sending less then required
  )

      try {
        await program.methods.buyShares(Amounts.buyAmount)
        .accountsStrict({
          user: newBuyer.publicKey,
          config: vals.config,
          protocolVault: vals.configVault,
          property: vals.property,
          paymentMint: paymentTokens.publicKey,
          propertyToken: vals.propertyToken,
          userTokenAta: newBuyerTokenATA,
          userShareAta: newBuyerShareATA,
          propertyVault: vals.propertyVault,
          systemProgram,
          tokenProgram,
          associatedTokenProgram
        })
        .signers([vals.buyer])
        .rpc()

        assert(false, "Expected this function to fail")
      }catch(err) {
        console.log(err)
        assert(true, "failed successfully")
      }


  })

  test("Withdraw", async () => {

    await program.methods.withdrawShares()
      .accountsStrict({
        owner: vals.protocolOwner.publicKey,
        protocolConfig: vals.config,
        paymentToken: paymentTokens.publicKey,
        protocolVault: vals.configVault,
        withdrawDestination: vals.protocolOwner.publicKey,
        destinationAta: vals.withdrawDestinationATA,
        tokenProgram,
        systemProgram,
        associatedTokenProgram
      })
      .signers([vals.protocolOwner])
      .rpc()

  })

})