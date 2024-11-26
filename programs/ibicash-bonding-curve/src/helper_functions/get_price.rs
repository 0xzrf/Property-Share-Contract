use crate::errors::Errors;
use anchor_lang::prelude::*;

pub fn get_price(supply: u64, amount: u64, multiplier: u64, base_price: u64, decimals: u8) -> Result<u64> {
    require!(multiplier != 0, Errors::ZeroMultiplier);
    require!(base_price != 0, Errors::InvalidBasePrice);
    let sum2;
    let sum1;
    if supply == 0 {
        sum1 = 0;
    } else {
        let supply_minus_one = supply.checked_sub(1).unwrap();

        // Compute (supply - 1) * supply
        let term1 = supply_minus_one.checked_mul(supply).unwrap();

        // Compute 2 * (supply - 1) + 1
        let term2 = supply_minus_one
            .checked_mul(2)
            .unwrap()
            .checked_add(1)
            .unwrap();

        // Compute (supply - 1) * supply * (2 * (supply - 1) + 1)
        let product = term1.checked_mul(term2).unwrap();

        // Divide by 6
        sum1 = product.checked_div(6).unwrap();
    }

    if supply == 0 && amount == 1 {
        sum2 = 0;
    } else {
        let supply_minus_one_plus_amount =
            supply.checked_sub(1).unwrap().checked_add(amount).unwrap();

        // Step 2: Calculate (supply + amount)
        let supply_plus_amount = supply.checked_add(amount).unwrap();

        // Step 3: Calculate (2 * (supply - 1 + amount) + 1)
        let term3 = supply_minus_one_plus_amount
            .checked_mul(2)
            .unwrap()
            .checked_add(1)
            .unwrap();

        // Step 4: Calculate the product
        let product = supply_minus_one_plus_amount
            .checked_mul(supply_plus_amount)
            .unwrap()
            .checked_mul(term3)
            .unwrap();

        // Step 5: Divide by 6
        sum2 = product.checked_div(6).unwrap();
    }

    let difference = sum1.checked_sub(sum2).unwrap();

    let price_multiplier = base_price.checked_mul(multiplier).unwrap();
    
    let summation = difference.checked_mul(price_multiplier).unwrap();
    let mut mult = multiplier;
    for _ in 0..decimals {
        mult = mult.checked_mul(10).unwrap();
    }

    let scaled_summation = summation.checked_mul(mult).unwrap();

    Ok(scaled_summation.checked_div(16000).unwrap() as u64)
}
