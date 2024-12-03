use anchor_lang::prelude::*;
use anchor_spl::token_interface::TokenInterface;

use crate::states::ProtocolConfig;

// Instruction used to update the payment token in the config state.

#[derive(Accounts)]
pub struct ChangeOwner<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, ProtocolConfig>,

    pub new_owner: SystemAccount<'info>,
    pub token_program: Interface<'info, TokenInterface>
}

impl<'info> ChangeOwner<'info> {
    pub fn owner_change(&mut self) -> Result<()> {

        self.config.owner = self.new_owner.key();

        Ok(())
    }
}