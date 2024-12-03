import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { IbicashBondingCurve } from "../target/types/ibicash_bonding_curve";
import { configOwner, getVals, mintingTokens, paymentTokens } from "../utils";
import { Keypair } from "@solana/web3.js";
import { expect } from "chai";

describe("UPDATE_PROTOCOL_FEE INSTRUCT TESTING", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.IbicashBondingCurve as Program<IbicashBondingCurve>;
  const systemProgram = anchor.web3.SystemProgram.programId;

  it("Successfully updates protocol fee", async () => {
    const vals = await getVals(provider.connection, program.programId);
    
    // Initialize with initial protocol fee
    const initialFee = 10;
    const newFee = 15;
    
    // Fetch initial config state
    const configAccountBefore = await program.account.protocolConfig.fetch(vals.config);
    
    // Update protocol fee
    await program.methods
      .updateProtocolFee(newFee)
      .accountsStrict({
        owner: vals.protocolOwner.publicKey,
        config: vals.config,
      })
      .signers([vals.protocolOwner])
      .rpc();

    // Fetch config and verify the fee was updated
    const configAccount = await program.account.protocolConfig.fetch(vals.config);
    expect(configAccount.protocolFeePercent).to.equal(newFee);
  });

  it("Fails when non-owner tries to update protocol fee", async () => {
    const vals = await getVals(provider.connection, program.programId);
    const nonOwner = Keypair.generate();

    try {
      await program.methods
        .updateProtocolFee(20)
        .accountsStrict({
          owner: nonOwner.publicKey,
          config: vals.config,
        })
        .signers([nonOwner])
        .rpc();
      
      expect.fail("Expected transaction to fail");
    } catch (error) {
      expect(error.toString()).to.include("Error");
    }
  });
});
