use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PropertyKey {
    pub owner: Pubkey, // The owner who created the property
    pub subject_fee_percent: u16, // The base fee percent
    pub bump: u8, // Property bumps
    pub multiplier: u64, // The multiplier received from the backend 
    pub base_price: u64, // The base price to be added in the bonding curve formula
    pub id: u64, // The unique identifier for property to allow a user to sell multiple,
    pub shares_mint_bump: u8, // When a share is sold, this token will be minted to represent user's share in property
}