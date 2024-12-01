use anchor_lang::prelude::*;

use crate::states::ProtocolConfig;

// Instruction used to update the payment token in the config state.

#[derive(Accounts)]
pub struct UpdateProtocolFee<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, ProtocolConfig>,
}

impl<'info> UpdateProtocolFee<'info> {
    pub fn protocol_fee_update(&mut self, protocol_fee: u16) -> Result<()> {

        self.config.protocol_fee_percent = protocol_fee;

        Ok(())
    }
}