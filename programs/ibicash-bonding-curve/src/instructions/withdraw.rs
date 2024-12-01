use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token_interface::{
        transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked
    }}
;
use crate::states::protocol_config::ProtocolConfig;

#[event]
pub struct FundsWithdrawn{
    pub destination: Pubkey,
    pub amount: u64
}

#[derive(Accounts)]
pub struct Withdraw<'info>{ 
    #[account(
        mut,
        constraint = owner.key() == protocol_config.owner
    )]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"config"],
        bump = protocol_config.bump,
        has_one = owner
    )]
    pub protocol_config: Account<'info, ProtocolConfig>,

    #[account(
        constraint = payment_token.key() == protocol_config.payment_token
    )]   
    pub payment_token: InterfaceAccount<'info, Mint>,

    #[account(
        mut, 
        associated_token::mint = payment_token,
        associated_token::authority = protocol_config
    )]
    pub protocol_vault: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: Safe because we verify it matches protocol_config.withdraw_destination
    #[account(
        constraint = withdraw_destination.key() == protocol_config.withdraw_destination
    )]
    pub withdraw_destination: AccountInfo<'info>,

    #[account(
        init_if_needed, 
        payer = owner,
        associated_token::mint = payment_token,
        associated_token::authority = withdraw_destination
    )]
    pub destination_ata: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>
}


impl<'info> Withdraw<'info> {
    pub fn withdraw(&mut self) -> Result<()> {
        self.send_signed_tokes(self.protocol_vault.to_account_info(), self.destination_ata.to_account_info(), self.protocol_vault.amount)?;

        emit!(FundsWithdrawn{
            destination: self.destination_ata.key(),
            amount: self.protocol_vault.amount
        });

        Ok(())
    }

    pub fn send_signed_tokes(&mut self, from: AccountInfo<'info>, to: AccountInfo<'info>, amount: u64) -> Result<()> {
        let bump = &[self.protocol_config.bump];
        let seeds = &[b"config" as &[u8], bump];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = TransferChecked {
            from,
            to,
            mint: self.payment_token.to_account_info(),
            authority: self.protocol_config.to_account_info()
        };

        let cpi_context = CpiContext::new_with_signer(self.token_program.to_account_info(), cpi_accounts, signer_seeds);

        transfer_checked(cpi_context, amount, self.payment_token.decimals)
    }
}