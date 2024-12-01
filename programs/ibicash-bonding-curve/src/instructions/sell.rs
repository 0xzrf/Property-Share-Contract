use crate::helper_functions::get_price::get_price;
use crate::states::{property_state::PropertyKey, protocol_config::ProtocolConfig};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked, Burn, burn},
};
use crate::errors::Errors;

#[event]
pub struct SellTrade {
    pub trader: Pubkey,
    pub id: u64,
    pub share_amount: u64,
    pub token_amount: u64,
    pub protocol_token_amount: u64,
    pub subject_token_amount: u64,
    pub supply: u64
}

#[derive(Accounts)]
pub struct Sell<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, ProtocolConfig>,

    #[account(
        mut,
        associated_token::authority = config,
        associated_token::mint = payment_mint
    )]
    pub protocol_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"property", property.owner.key().as_ref(), property.id.to_le_bytes().as_ref()],
        bump = property.bump
    )]
    pub property: Account<'info, PropertyKey>,

    #[account(
        constraint = payment_mint.key() == config.payment_token
    )]
    pub payment_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        seeds = [b"property_tokens", property.owner.key().as_ref(), property.id.to_le_bytes().as_ref()],
        bump,
    )]
    pub property_token: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = payment_mint,
        associated_token::authority = seller
    )]
    pub seller_token_ata: InterfaceAccount<'info, TokenAccount>, // The seller's token account for holding the payment tokens

    #[account(
        mut,
        associated_token::mint = property_token,
        associated_token::authority = seller
    )]
    pub seller_share_ata: InterfaceAccount<'info, TokenAccount>,  // The seller's token account for holding the property shares

    #[account(
        mut,
        associated_token::mint = payment_mint,
        associated_token::authority = property
    )]
    pub property_vault: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>
}

impl<'info> Sell<'info> {

    pub fn sell_shares(&mut self, amount: u64) -> Result<()> {
        require!(self.property_token.supply > amount, Errors::InvalidShareAmount);
        require!(self.seller_share_ata.amount >= amount, Errors::InsufficientFunds);
        
        let price = get_price(self.property_token.supply - amount, amount, self.property.multiplier, self.property.base_price, self.property_token.decimals)?;

        let base: u64 = u64::from(10_u64);
        let exponent: u32 = self.property_token.decimals as u32;

        let protocol_mul = (self.config.protocol_fee_percent as u64).checked_div(
            base.checked_pow(exponent).expect("Overflow occurred while calculating power for Protocol multiply")
        ).unwrap();

        let subject_mul = (self.property.subject_fee_percent as u64).checked_div(
            base.checked_pow(exponent).expect("Overflow occurred while calculating power for Protocol multiply")
        ).unwrap();

        let protocol_fee = price.checked_mul(protocol_mul as u64).unwrap();
        let subject_fee = price.checked_mul(subject_mul as u64).unwrap();

        let user_receives = price.checked_sub(protocol_fee).unwrap().checked_sub(subject_fee).unwrap();
        // property vault sends the user_receives amount to the seller's ata
        // msg!("Done");

        msg!("User receives: {}, amount: {}", user_receives, self.property_vault.amount);

        self.send_signed_token(
            user_receives, 
            self.property_vault.to_account_info(), 
            self.seller_token_ata.to_account_info(), 
            self.payment_mint.to_account_info(), 
            self.property.to_account_info(), 
            self.property_token.decimals
        )?; 
        
        // property vault sends the protocol fee to the protocol vault
        self.send_signed_token(
            protocol_fee,
            self.property_vault.to_account_info(),
            self.protocol_vault.to_account_info(),
            self.payment_mint.to_account_info(),
            self.property.to_account_info(),
            self.property_token.decimals
        )?;

        // burning the property_token since user sold the shares
        
        
        self.burn_property_token(amount)?;

        // emiting the event
        emit!(SellTrade {
            trader: self.seller.key(),
            id: self.property.id,
            share_amount: amount,
            token_amount: price,
            protocol_token_amount: protocol_fee,
            subject_token_amount: subject_fee,
            supply: self.property_token.supply
        });

        Ok(())
    }

    pub fn send_signed_token(&mut self, amount: u64, from: AccountInfo<'info>, to: AccountInfo<'info>, mint: AccountInfo<'info>, authority: AccountInfo<'info>, decimals: u8) -> Result<()> {
        let owner_key = self.property.owner.key();
        let seeds = &[
            b"property".as_ref(),
            owner_key.as_ref(),
            &self.property.id.to_le_bytes(),
            &[self.property.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = TransferChecked {
            authority,
            from,
            to,
            mint
        };

        let cpi_context = CpiContext::new_with_signer(
            self.token_program.to_account_info(), 
            cpi_accounts, 
            signer_seeds
        );

        transfer_checked(cpi_context, amount, decimals)
    }

    pub fn burn_property_token(&mut self, amount: u64) -> Result<()> {        
    
        let owner_key = self.property.owner.key();
        let seeds = &[
            b"property".as_ref(),
            owner_key.as_ref(),
            &self.property.id.to_le_bytes(),
            &[self.property.bump],
        ];    let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Burn {
            mint: self.property_token.to_account_info(),
            from: self.seller_share_ata.to_account_info(),
            authority: self.seller.to_account_info()
        };

        let cpi_context = CpiContext::new_with_signer(self.token_program.to_account_info(), cpi_accounts, signer_seeds);

        burn(cpi_context, amount)
    }
}