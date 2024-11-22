use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PropertyState {
    pub owner: Pubkey,
    pub fee: u16,
    pub bump: u8,
    pub mint_bump: u8,
    pub multiplier: u64,
    pub base_price: u64
}