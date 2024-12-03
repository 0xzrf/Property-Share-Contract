import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { IbicashBondingCurve } from "../target/types/ibicash_bonding_curve";
import { configOwner, getVals, mintingTokens, paymentTokens } from "../utils";
import { Keypair } from "@solana/web3.js";
import { expect } from "chai";
import { createMint, TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("UPDATE_TOKEN INSTRUCT TESTING", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.IbicashBondingCurve as Program<IbicashBondingCurve>;
  
  const tokenProgram = TOKEN_PROGRAM_ID

  it("Successfully updates payment token", async () => {
    const vals = await getVals(provider.connection, program.programId);
    
     // Create new payment token properly
     const newPaymentToken = Keypair.generate();
     await createMint(
       provider.connection,
       configOwner, // payer
       configOwner.publicKey, // mint authority
       null, // freeze authority
       6, // decimals
       newPaymentToken
     );
        
     const configAccountBefore = await program.account.protocolConfig.fetch(vals.config);

    // Update token
    await program.methods
      .tokenUpdate()
      .accountsStrict({
        owner: vals.protocolOwner.publicKey,
        config: vals.config,
        newMint: newPaymentToken.publicKey,
        tokenProgram
      })
      .signers([vals.protocolOwner])
      .rpc();

      

    // Fetch config and verify the token was updated
    const configAccount = await program.account.protocolConfig.fetch(vals.config);
    expect(configAccount.paymentToken.toString()).to.equal(newPaymentToken.publicKey.toString());
  });

  it("Fails when non-owner tries to update token", async () => {
    const vals = await getVals(provider.connection, program.programId);
    const newPaymentToken = Keypair.generate();
    const nonOwner = Keypair.generate();

    try {
      await program.methods
        .tokenUpdate()
        .accountsStrict({
            owner: vals.protocolOwner.publicKey,
            config: vals.config,
            newMint: newPaymentToken.publicKey,
            tokenProgram
          })
        .signers([nonOwner, newPaymentToken])
        .rpc();
      
      expect.fail("Expected transaction to fail");
    } catch (error) {
      expect(error.toString()).to.include("Error");
    }
  });
});
