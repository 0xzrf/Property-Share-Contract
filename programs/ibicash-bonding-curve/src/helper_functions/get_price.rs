use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ProtocolConfig{ 
    pub owner: Pubkey, // The owner of the protocol
    pub bump: u8, // The protool bump
    pub protocol_fee_percent: u16, // fee percent of protocol,
    pub payment_token: Pubkey, // The mint address of the token that will be used for payment
    pub withdraw_destination: Pubkey, // The destination where the protocol fees will be withdrawn to
}