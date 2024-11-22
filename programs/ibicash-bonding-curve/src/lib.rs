use anchor_lang::prelude::*;

declare_id!("8TobWYYPzGLwVdNBwgsjEo52DKsZLaDDDv2CWMMTwREj");

#[program]
pub mod ibicash_bonding_curve {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
