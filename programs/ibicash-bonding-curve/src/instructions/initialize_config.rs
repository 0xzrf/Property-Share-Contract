use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        Mint, 
        TokenAccount,
        TokenInterface,
    }
};

use crate::states::ProtocolConfig;

#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    pub payment_token: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        seeds = [b"config"],
        bump,
        payer = owner,
        space = ProtocolConfig::INIT_SPACE + 8
    )]
    pub config: Account<'info, ProtocolConfig>,

    #[account(
        init,
        payer = owner,
        associated_token::mint = payment_token,
        associated_token::authority = owner
    )]
    pub protocol_vault: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>
}

impl<'info> InitConfig<'info> {
    pub fn init_config(&mut self, bumps: &InitConfigBumps, protocol_fee_percent: u16) -> Result<()> {
        self.config.set_inner(ProtocolConfig {
           owner: self.owner.key(),
           bump: bumps.config,
           protocol_fee_percent,
           payment_token: self.payment_token.key(),
           withdraw_destination: self.owner.key(),
        });
        Ok(())
    }
}