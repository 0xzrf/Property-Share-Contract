use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        Mint, 
        TokenAccount,
        TokenInterface,
    }
};
use crate::{
    states::property_state::PropertyState,
    errors::Errors
};

#[derive(Accounts)]
#[instruction(id: u64)]
pub struct InitProperty<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init, 
        seeds = [b"property", owner.key().as_ref(), id.to_le_bytes().as_ref()],
        bump,
        payer = owner,
        space = PropertyState::INIT_SPACE + 8
    )]
    pub property: Account<'info, PropertyState>,

    /// USDC mint which will be used to buy shares
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    // This is the account that will store the fee collected for each buy
    #[account(
        init,
        payer = owner,
        associated_token::mint = usdc_mint,
        associated_token::authority = property
    )]
    pub property_vault: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>
}