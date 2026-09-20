import { IsEmail } from "class-validator";

export class InitPaystackTicketDTO {
  // Paystack requires an email on the checkout page; the User entity's own
  // email is optional, so this is collected explicitly — mirrors
  // InitPaystackDepositDTO's same reasoning.
  @IsEmail({}, { message: "a valid email is required for Paystack checkout" })
  email!: string;
}
