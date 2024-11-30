use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};

use crate::states::ProtocolConfig;

// Instruction used to update the payment token in the config state.

#[derive(Accounts)]
pub struct UpdateTokens<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, ProtocolConfig>,

    pub new_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>
}

impl<'info> UpdateTokens<'info> {
    pub fn update_token(&mut self) -> Result<()> {

        self.config.payment_token = self.new_mint.key();

        Ok(())
    }
}