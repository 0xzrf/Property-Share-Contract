use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        Mint, 
        TokenAccount,
        TokenInterface,
    }
};
use crate::states::property_state::PropertyKey;

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
        space = PropertyKey::INIT_SPACE + 8
    )]
    pub property: Account<'info, PropertyKey>,

    /// The token to buy the shares of this property
    pub payment_token: InterfaceAccount<'info, Mint>,

    // This is the account that will store the fee collected for each buy
    #[account(
        init,
        payer = owner,
        associated_token::mint = payment_token,
        associated_token::authority = property
    )]
    pub property_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init, 
        payer = owner,
        seeds = [b"property_tokens", owner.key().as_ref(), id.to_le_bytes().as_ref()],
        bump,
        mint::decimals = 6,
        mint::authority = property
    )]
    pub property_token: InterfaceAccount<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>
}

impl<'info> InitProperty<'info> {
    // setting multipler to a constant - urgent fix
   pub fn init_property(&mut self, bumps: &InitPropertyBumps, id: u64, subject_fee_percent: u16, multiplier: u64, base_price: u64) -> Result<()> {
     self.property.set_inner(PropertyKey {
        owner: self.owner.key(),
        subject_fee_percent,
        bump: bumps.property,
        multiplier,
        base_price,
        id,
        shares_mint_bump: bumps.property_token,
     });
     Ok(())
   }
}