use anchor_lang::prelude::error_code;

#[error_code]
pub enum Errors {
    #[msg("Failed to fetch the multiplier")]
    FailedToFetch
}