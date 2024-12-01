use anchor_lang::prelude::*;

use crate::states::property_state::PropertyKey;

// Instruction used to update the payment token in the config state.

#[derive(Accounts)]
pub struct UpdateBaseFee<'info> {
    #[account(
        mut,
        constraint = property.owner.key() == owner.key()
    )]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"property",property.owner.key().as_ref(), property.id.to_le_bytes().as_ref()],
        bump = property.bump
    )]
    pub property: Account<'info, PropertyKey>
}

impl<'info> UpdateBaseFee<'info> {
    pub fn base_fee_update(&mut self, base_price: u64) -> Result<()> {

        self.property.base_price = base_price;

        Ok(())
    }
}