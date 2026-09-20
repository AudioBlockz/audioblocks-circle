import { Matches } from "class-validator";

export class PoolDepositDTO {
  // A human decimal amount, e.g. "10" or "10.5" — base-unit conversion
  // (18 decimals) happens in PoolService, not here.
  @Matches(/^\d+(\.\d+)?$/, { message: "amount must be a positive decimal string" })
  amount!: string;
}
