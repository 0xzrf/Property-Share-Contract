use anchor_lang::prelude::*;
use anchor_spl::token_interface::TokenInterface;

use crate::states::ProtocolConfig;

// Instruction used to update the payment token in the config state.

#[derive(Accounts)]
pub struct UpdateDestination<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, ProtocolConfig>,

    pub new_destination: SystemAccount<'info>,
    pub token_program: Interface<'info, TokenInterface>
}

impl<'info> UpdateDestination<'info> {
    pub fn destination_update(&mut self) -> Result<()> {

        self.config.withdraw_destination = self.new_destination.key();

        Ok(())
    }
}