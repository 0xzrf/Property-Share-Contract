import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { IbicashBondingCurve } from "../target/types/ibicash_bonding_curve";
import { getVals, GetValsReturn, MintTokenArgs, mintingTokens } from "../utils";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
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

  before(async () => {

    // Get all the values from a config file
     vals = await getVals(provider.connection)

     // Make the required values min and also create and mint neecessary 
     const mintArgs: MintTokenArgs = {
      amount: 1000,
      buyer: vals.buyer,
      config: vals.config,
      connection: provider.connection,
      payer: vals.payer,
      paymentTokens: vals.paymentTokens,
      property: vals.property,
      shareTokens: vals.shareTokens
     }

     await program.methods.initConfig(10) // Protocol fee
     .accountsStrict({
      associatedTokenProgram,
      config: vals.config,
      owner: vals.payer.publicKey,
      paymentToken: vals.paymentTokens.publicKey,
      protocolVault: vals.configVault,
      systemProgram,
      tokenProgram
     })
     .signers([vals.payer])
     .rpc()

     await program.methods.initProp(new anchor.BN(vals.ID), 10, new anchor.BN(1000), new anchor.BN(100)) // unique identifier, subject fee, multiplier, base_price
     .accountsStrict({
      owner: vals.payer.publicKey,
      associatedTokenProgram,
      systemProgram,
      tokenProgram,
      paymentToken: vals.paymentTokens.publicKey,
      property: 
     })
  })  

  })  


});