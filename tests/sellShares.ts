import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { IbicashBondingCurve } from "../target/types/ibicash_bonding_curve";
import { getVals, GetValsReturn, MintTokenArgs, mintingTokens, paymentTokens } from "../utils";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { TOKEN_PROGRAM_ID, getAccount, getMint } from "@solana/spl-token";
import { test } from "mocha";
import { assert } from "console";

const Amounts = {
  buyAmount: new anchor.BN(10),
  protocolFee: 2,
  sellAmount: new anchor.BN(2)
}

describe("SELL INSTRUCT TESTING", () => {
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
  
    const mintArgs: MintTokenArgs = {
      amount: 10000000,
      buyer: vals.buyer,
      configOwner: vals.protocolOwner,
      connection: provider.connection,
      payer: vals.propertyOwner,
      paymentTokens: paymentTokens,
      buyerTokenATA: vals.buyerTokenATA,
      programId: program.programId,
      destinationATA: vals.buyerTokenATA,
      createMnt: false
    }
    
    await mintingTokens(mintArgs)

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
  });

  test("to check the sell instruction is showing expected behaviour", async () => {
    const userTokenAtaBefore = await getAccount(provider.connection, vals.buyerTokenATA);
    const userShareAtaBefore = await getAccount(provider.connection, vals.buyerShareATA);
    const propertyTokenBefore = await getMint(provider.connection, vals.propertyToken);

    await program.methods.sellShares(Amounts.sellAmount)
    .accountsStrict({
      seller: vals.buyer.publicKey,
      config: vals.config,
      protocolVault: vals.configVault,
      property: vals.property,
      paymentMint: paymentTokens.publicKey,
      propertyToken: vals.propertyToken,
      sellerTokenAta: vals.buyerTokenATA,
      sellerShareAta: vals.buyerShareATA,
      propertyVault: vals.propertyVault,
      systemProgram,
      tokenProgram,
      associatedTokenProgram
    })
    .signers([vals.buyer])
    .rpc()

    const userAfterTokenATA = await getAccount(provider.connection, vals.buyerTokenATA);
    const userAfterShareATA = await getAccount(provider.connection, vals.buyerShareATA);
    const propertyTokenAfter = await getMint(provider.connection, vals.propertyToken);
    
    assert(
      userAfterShareATA.amount === userShareAtaBefore.amount - BigInt(Amounts.sellAmount.toString()),
      "Share balance should decrease by sell amount"
    );

    assert(
      userAfterTokenATA.amount > userTokenAtaBefore.amount,
      "Token balance should increase after sell"
    );

    assert(
      propertyTokenAfter.supply === propertyTokenBefore.supply - BigInt(Amounts.sellAmount.toString()),
      "Total supply should decrease by sell amount"
    );
  });

  test("throw InvalidShareAmount error", async() => {
    try {
      const propertyToken = await getMint(provider.connection, vals.propertyToken);
      await program.methods.sellShares(new anchor.BN((propertyToken).supply.toString()))
    .accountsStrict({
      seller: vals.buyer.publicKey,
      config: vals.config,
      protocolVault: vals.configVault,
      property: vals.property,
      paymentMint: paymentTokens.publicKey,
      propertyToken: vals.propertyToken,
      sellerTokenAta: vals.buyerTokenATA,
      sellerShareAta: vals.buyerShareATA,
      propertyVault: vals.propertyVault,
      systemProgram,
      tokenProgram,
      associatedTokenProgram
    })
    .signers([vals.buyer])
    .rpc()

      assert(false, "Should throw InvalidShareAmount error")
    } catch(e) {
      assert(e instanceof Error && e.message.includes("InvalidShareAmount"), "Should throw InvalidShareAmount error")
    }
  })

  test("throw Insufficient error", async() => {
    const userShareATA = await getAccount(provider.connection, vals.buyerShareATA);

    try {
     
      await program.methods.sellShares(new anchor.BN(userShareATA.amount.toString()).addn(5))
    .accountsStrict({
      seller: vals.buyer.publicKey,
      config: vals.config,
      protocolVault: vals.configVault,
      property: vals.property,
      paymentMint: paymentTokens.publicKey,
      propertyToken: vals.propertyToken,
      sellerTokenAta: vals.buyerTokenATA,
      sellerShareAta: vals.buyerShareATA,
      propertyVault: vals.propertyVault,
      systemProgram,
      tokenProgram,
      associatedTokenProgram
    })
    .signers([vals.buyer])
    .rpc()

      assert(false, "Should throw InvalidShareAmount error")
    } catch(e) {
      assert(e instanceof Error && e.message.includes("InvalidShareAmount"), "Should throw InvalidShareAmount error")
    }
  })
})