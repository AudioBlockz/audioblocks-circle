import { Matches } from "class-validator";

export class InitFiatDepositDTO {
  // A human decimal amount, e.g. "10" or "10.50" — cent conversion happens
  // in FiatDepositService, not here.
  @Matches(/^\d+(\.\d{1,2})?$/, { message: "amount must be a positive decimal string" })
  amount!: string;
}
