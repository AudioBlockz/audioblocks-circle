import { IsEmail, Matches } from "class-validator";

export class InitPaystackDepositDTO {
  // A human decimal amount in NGN, e.g. "5000" or "5000.50" — kobo
  // conversion happens in FiatDepositService, not here.
  @Matches(/^\d+(\.\d{1,2})?$/, { message: "amount must be a positive decimal string" })
  amount!: string;

  // Paystack requires an email on the checkout page; the User entity's own
  // email is optional, so this is collected explicitly rather than assumed.
  @IsEmail({}, { message: "a valid email is required for Paystack checkout" })
  email!: string;
}
