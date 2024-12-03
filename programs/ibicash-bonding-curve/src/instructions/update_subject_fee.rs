use anchor_lang::prelude::*;

use crate::states::property_state::PropertyKey;

// Instruction used to update the payment token in the config state.

#[derive(Accounts)]
pub struct UpdateSubjectFee<'info> {
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

impl<'info> UpdateSubjectFee<'info> {
    pub fn subject_fee_update(&mut self, subject_fee: u16) -> Result<()> {

        self.property.subject_fee_percent = subject_fee;

        Ok(())
    }
}