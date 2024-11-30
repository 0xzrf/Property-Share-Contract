import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { IbicashBondingCurve } from "../target/types/ibicash_bonding_curve";
import { configOwner, getVals, mintingTokens, paymentTokens } from "../utils";
import { Keypair } from "@solana/web3.js";
import { expect } from "chai";
import { createMint, TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("Update Token Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.IbicashBondingCurve as Program<IbicashBondingCurve>;
  
  const tokenProgram = TOKEN_PROGRAM_ID

  it("Successfully updates payment token", async () => {
    // Get initial values and setup
    console.log("INIT TEST 1")
    const vals = await getVals(provider.connection, program.programId);
    console.log("vals", vals);
    
    console.log("=== Account Values ===");
    console.log("buyerTokenATA:", vals.buyerTokenATA.toString());
    console.log("buyerShareATA:", vals.buyerShareATA.toString());
    console.log("configVault:", vals.configVault.toString());
    console.log("propertyVault:", vals.propertyVault.toString());
    console.log("property:", vals.property.toString());
    console.log("propertyToken:", vals.propertyToken.toString());
    console.log("config:", vals.config.toString());
    console.log("protocolOwner pubkey:", vals.protocolOwner.publicKey.toString());
    console.log("buyer pubkey:", vals.buyer.publicKey.toString());
    console.log("ID:", vals.ID.toString());
    console.log("shareTokens pubkey:", vals.shareTokens.publicKey.toString());
    console.log("propertyOwner pubkey:", vals.propertyOwner.publicKey.toString());
    console.log("withdrawDestinationATA:", vals.withdrawDestinationATA.toString());
    console.log("==================");

    // Create initial payment token and mint some tokens
    // await mintingTokens({
    //   connection: provider.connection,
    //   paymentTokens,
    //   configOwner,
    //   payer: configOwner,
    //   buyer: vals.buyer,
    //   amount: 1000,
    //   buyerTokenATA: vals.buyerTokenATA,
    //   programId: program.programId,
    //   destinationATA: vals.withdrawDestinationATA,
    //   createMnt: true
    // });

    console.log("Minting the new tokens started")
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
        
    console.log("Owner", vals.protocolOwner.publicKey.toString())
     console.log("new payment token", newPaymentToken.publicKey.toString())
     const configAccountBefore = await program.account.protocolConfig.fetch(vals.config);

     console.log("PaymentToken before", configAccountBefore.paymentToken.toString())
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
