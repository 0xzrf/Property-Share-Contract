use anchor_lang::prelude::*;

declare_id!("8TobWYYPzGLwVdNBwgsjEo52DKsZLaDDDv2CWMMTwREj");

pub mod states;
pub mod instructions;
pub mod helper_functions;
pub mod errors;
pub mod constants;

use instructions::{
    initialize_config::*,
    init_property::*,
    update_token::*,
    buy::*,
    sell::*,
    withdraw::*
};

#[program]
pub mod ibicash_bonding_curve {
    use super::*;

    pub fn init_config(ctx: Context<InitConfig>, protocol_fee_percent: u16)-> Result<()> {
        ctx.accounts.config_init(&ctx.bumps, protocol_fee_percent)
    }


    pub fn init_prop(ctx: Context<InitProperty>, id: u64, subject_fee_percent: u16, multiplier: u64, base_price: u64) -> Result<()> {
        ctx.accounts.init_property(&ctx.bumps, id, subject_fee_percent, multiplier, base_price)
    }

    pub fn buy_shares(ctx: Context<Buy>, amount: u64) -> Result<()> {
        ctx.accounts.buy_shares(amount)
    }

    pub fn sell_shares(ctx: Context<Sell>,amount: u64) -> Result<()> {
        ctx.accounts.sell_shares(amount)
    }

    pub fn withdraw_shares(ctx: Context<Withdraw>) -> Result<()> {
        ctx.accounts.withdraw()
    }

    pub fn token_update(ctx: Context<UpdateTokens>) -> Result<()> {
        ctx.accounts.update_token()
    }
}