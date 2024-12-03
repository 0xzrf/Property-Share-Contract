import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { IbicashBondingCurve } from "../target/types/ibicash_bonding_curve";
import { configOwner, getVals, mintingTokens, paymentTokens } from "../utils";
import { Keypair } from "@solana/web3.js";
import { expect } from "chai";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createMint, TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("UPDATE_MULTIPLIER INSTRUCT TESTING", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.IbicashBondingCurve as Program<IbicashBondingCurve>;
  
  const systemProgram = anchor.web3.SystemProgram.programId
  const tokenProgram = TOKEN_PROGRAM_ID
  const MULTIPLIER = new anchor.BN(1000)

  const associatedTokenProgram = ASSOCIATED_TOKEN_PROGRAM_ID

  it("Successfully updates payment token", async () => {
    const vals = await getVals(provider.connection, program.programId);
    await program.methods.initProp(new anchor.BN(vals.ID), 10, MULTIPLIER, new anchor.BN(100)) // unique identifier, subject fee, multiplier, base_price
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
     const configAccountBefore = await program.account.protocolConfig.fetch(vals.config);

    // Update token
    await program.methods.updateMultiplier(MULTIPLIER)
    .accountsStrict({
        owner: vals.propertyOwner.publicKey,
        property: vals.property
    })
    .signers([vals.propertyOwner])
    .rpc()

    // Fetch config and verify the token was updated
    const configAccount = await program.account.propertyKey.fetch(vals.property);
    expect(configAccount.multiplier.toString()).to.equal(MULTIPLIER.toString());
  });

});
