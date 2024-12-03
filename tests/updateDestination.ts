import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { IbicashBondingCurve } from "../target/types/ibicash_bonding_curve";
import { configOwner, getVals } from "../utils";
import { Keypair } from "@solana/web3.js";
import { expect } from "chai";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("UPDATE_WITHDRAW_DESTINATION INSTRUCT TESTING", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.IbicashBondingCurve as Program<IbicashBondingCurve>;
  const tokenProgram = TOKEN_PROGRAM_ID;

  it("Successfully updates withdraw destination", async () => {
    const vals = await getVals(provider.connection, program.programId);
    const newDestination = Keypair.generate();
   
    // Update withdraw destination
    await program.methods
      .updateDestination()
      .accountsStrict({
        owner: vals.protocolOwner.publicKey,
        config: vals.config,
        newDestination: newDestination.publicKey,
        tokenProgram: tokenProgram,
      })
      .signers([vals.protocolOwner])
      .rpc();

    // Fetch config and verify the destination was updated
    const configAccount = await program.account.protocolConfig.fetch(vals.config);
    expect(configAccount.withdrawDestination.toString()).to.equal(newDestination.publicKey.toString());
  });

  it("Fails when non-owner tries to update withdraw destination", async () => {
    const vals = await getVals(provider.connection, program.programId);
    const nonOwner = Keypair.generate();
    const newDestination = Keypair.generate();

    try {
      await program.methods
        .updateDestination()
        .accountsStrict({
          owner: nonOwner.publicKey,
          config: vals.config,
          newDestination: newDestination.publicKey,
          tokenProgram: tokenProgram,
        })
        .signers([nonOwner])
        .rpc();
      
      expect.fail("Expected transaction to fail");
    } catch (error) {
      expect(error.toString()).to.include("Error");
    }
  });
});
