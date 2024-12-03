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
    withdraw::*,
    update_base_fee::*,
    update_destination::*,
    update_multiplier::*,
    update_protocol_fee::*,
    update_subject_fee::*,
    change_owner::*
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

    pub fn update_base_fee(ctx: Context<UpdateBaseFee>, base_price: u64) -> Result<()> {
        ctx.accounts.base_fee_update(base_price)
    }

    pub fn update_destination(ctx: Context<UpdateDestination>) -> Result<()> {
        ctx.accounts.destination_update()
    }

    pub fn update_subject_fee(ctx: Context<UpdateSubjectFee>, subject_fee: u16) -> Result<()> {
        ctx.accounts.subject_fee_update(subject_fee)
    }

    pub fn update_multiplier(ctx: Context<UpdateMultiplier>, multiplier: u64) -> Result<()> {
        ctx.accounts.multiplier_update(multiplier)
    }

    pub fn update_protocol_fee(ctx: Context<UpdateProtocolFee>, protocol_fee: u16) -> Result<()> {
        ctx.accounts.protocol_fee_update(protocol_fee)
    }

    pub fn change_owner(ctx: Context<ChangeOwner>) -> Result<()> {
        ctx.accounts.owner_change()
    }
}