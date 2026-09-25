import { PrivyClient } from "@privy-io/server-auth";
import { Repository } from "typeorm";
import { User, UserRole } from "../entities/User";
import AppDataSource from "../config/db";
import { CreateUserDTO } from "../dtos/CreateUserDTO";
import { UserService } from "./UserService";
import { createCircleArcWallet } from "../utils/circleWallet";
import dotenv from "dotenv";

dotenv.config();

const PRIVY_APP_ID = process.env.PRIVY_APP_ID as string;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET as string;

const privy = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

export class AuthService {
  private userRepo: Repository<User>;
  private userService: UserService;

  constructor() {
    this.userRepo = AppDataSource.getRepository(User);
    this.userService = new UserService();
  }

  // Verifies a Privy access token locally against Privy's JWKS and returns
  // the Privy user id (DID) it was issued for. Throws if the token is
  // missing, expired, or was not issued by this app's Privy instance.
  async verifyAccessToken(accessToken: string): Promise<string> {
    const { userId } = await privy.verifyAuthToken(accessToken);
    return userId;
  }

  async getUserByAccessToken(accessToken: string): Promise<User | null> {
    const privyUserId = await this.verifyAccessToken(accessToken);
    return this.userRepo.findOneBy({ privyUserId });
  }

  // Idempotent "ensure this Privy identity has an app profile" call. First
  // sign-in creates the row (pulling wallet/email straight from Privy, not
  // from client-supplied fields), later sign-ins just fetch it.
  async sync(
    accessToken: string,
    role?: UserRole,
    username?: string
  ): Promise<{ user: User; isNewUser: boolean }> {
    const privyUserId = await this.verifyAccessToken(accessToken);

    const existing = await this.userRepo.findOneBy({ privyUserId });
    if (existing) {
      // Self-serve listener -> artist upgrade ("Join as Artist" while
      // already logged in). One-directional and narrow on purpose: this is
      // the only place an existing user's role can change, and it only
      // ever moves a LISTENER to ARTIST — an existing artist/admin role is
      // left untouched even if `role` is passed, and AuthController already
      // restricts `role` to SELF_SERVE_ROLES before it gets here, so this
      // can never be used to reach ADMIN.
      if (role === UserRole.ARTIST && existing.role === UserRole.LISTENER) {
        existing.role = UserRole.ARTIST;
        await this.userRepo.save(existing);
      }
      return { user: existing, isNewUser: false };
    }

    // Two concurrent /sync calls for a brand-new user (independent tabs, a
    // retried request, or any future re-introduction of the double-mount
    // race the AuthProvider comment above describes) would otherwise each
    // create their own Circle wallet and each fund it from the same
    // treasury wallet at once — a nonce race where one transfer can fail,
    // and whichever call happens to win the DB insert below keeps whichever
    // wallet it created, funded or not. An advisory lock keyed on
    // privyUserId serializes first-time signups for the same identity so
    // only one of them ever reaches the wallet-creation/on-chain-setup work
    // below; the loser just waits for the lock and then finds the row
    // already there.
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.query("SELECT pg_advisory_lock(hashtext($1))", [privyUserId]);

      const racedExisting = await this.userRepo.findOneBy({ privyUserId });
      if (racedExisting) {
        return { user: racedExisting, isNewUser: false };
      }

      const privyUser = await privy.getUser(privyUserId);
      // Login/session verification stays on Privy (unaffected by the Arc
      // Testnet signing block — that's a separate Privy product surface).
      // The wallet itself, though, is now a Circle developer-controlled
      // wallet rather than Privy's embedded wallet: Privy's app is blocked
      // from signing ANY transaction on Arc Testnet ("App is not authorized
      // to transact on chain eip155:5042002", unresolved), so a
      // Privy-managed wallet address would be unusable for on-chain calls.
      // See the "Migrate Off Privy" plan, Phase A.
      const wallet = await createCircleArcWallet(process.env.CIRCLE_WALLET_SET_ID!);
      const walletAddress = wallet.address;
      const email = privyUser.email?.address ?? privyUser.google?.email;

      const dto = Object.assign(new CreateUserDTO(), {
        privyUserId,
        walletAddress,
        email,
        role: role ?? UserRole.LISTENER,
        username,
      });

      const user = await this.userService.createUser(dto);
      return { user, isNewUser: true };
    } finally {
      await queryRunner.query("SELECT pg_advisory_unlock(hashtext($1))", [privyUserId]);
      await queryRunner.release();
    }
  }
}
