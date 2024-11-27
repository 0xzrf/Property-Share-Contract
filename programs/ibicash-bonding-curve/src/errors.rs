use anchor_lang::prelude::error_code;

#[error_code]
pub enum Errors {
    #[msg("Failed to fetch the multiplier")]
    FailedToFetch,
    #[msg("Invalid multiplier, cannot be zero")]
    ZeroMultiplier,
    #[msg("Invalid base price, cannot be zero")]
    InvalidBasePrice,
    #[msg("Insufficient balance")]
    InsufficientFunds,
    #[msg("Cannot sell the last share")]
    InvalidShareAmount,
}