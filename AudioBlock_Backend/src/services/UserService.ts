import { Repository } from "typeorm";
import AppDataSource from "../config/db";
import { User } from "../entities/User";
import { CreateUserDTO } from "../dtos/CreateUserDTO";
import { TransactionLog } from "../entities/TransactionLog";
import { ArtistService } from "./Artist/ArtistService";

export class UserService {
    private userRepo: Repository<User>;
    private transactionLogRepo: Repository<TransactionLog>;
    private artistService: ArtistService;
    constructor() {
        this.userRepo = AppDataSource.getRepository(User);
        this.transactionLogRepo = AppDataSource.getRepository(TransactionLog);
        this.artistService = new ArtistService();
    }

    // Identity (wallet ownership, email) is already verified by Privy before
    // this is called — see AuthService.sync. This only ever creates a user
    // for a privyUserId that isn't in the database yet.
    async createUser(data: CreateUserDTO): Promise<User> {
        const dto = Object.assign(new CreateUserDTO(), data);

        if (await this.userRepo.findOneBy({ walletAddress: dto.walletAddress })) {
            throw new Error("User already exists");
        }

        let onChainAccount: string | undefined = undefined;

        if (dto.role === "artist") {
            const artistName = dto.username || dto.name || `Artist ${dto.walletAddress.slice(0, 8)}`;
            // Best-effort — a brand-new wallet has no USDC (Arc's gas token)
            // yet, so this can fail purely on insufficient gas. That's a
            // funding/ops problem, not a reason to reject the signup itself;
            // the on-chain account can be set up later (e.g. a retry once
            // the wallet's funded) without the user needing to sign up again.
            try {
                onChainAccount = await this.artistService.setupArtistAccountOnChain(dto.walletAddress, artistName);
                console.log("On-chain account setup initiated:", onChainAccount);
            } catch (err) {
                console.error(`On-chain account setup failed for ${dto.walletAddress}, continuing signup without it:`, err);
            }
        }

        const user = this.userRepo.create(dto);
        const savedUser = await this.userRepo.save(user);

        // transactions_logs records on-chain events specifically (every
        // other write to it always carries a real tx hash) — a listener
        // signup has no on-chain step, so there's nothing to log here.
        if (onChainAccount) {
            const log = this.transactionLogRepo.create({
                user_id: savedUser.id,
                txHash: onChainAccount,
                action: "CREATE_USER",
                description: `User with wallet ${savedUser.walletAddress} created.`,
            });
            await this.transactionLogRepo.save(log);
        }

        return savedUser;
    }

    async getUserByWalletAddress(walletAddress: string): Promise<User | null> {
        return await this.userRepo.findOneBy({ walletAddress });
    }

    async getAllUsers(): Promise<User[]> {
        return await this.userRepo.find();
    }

    async getUserById(id: string): Promise<User | null> {
        return await this.userRepo.findOneBy({ id });
    }

    async updateUser(id: string, data: Partial<User>): Promise<User | null> {
        const user = await this.userRepo.findOneBy({ id });
        if (!user) {
            throw new Error("User not found");
        }

        if(data.walletAddress && data.walletAddress !== user.walletAddress) {
            const existingUser = await this.userRepo.findOneBy({ walletAddress: data.walletAddress });
            if (existingUser) {
                throw new Error("User already exists");
            }
        }

        if(data.email && data.email !== user.email) {
            const existingUser = await this.userRepo.findOneBy({ email: data.email });
            if (existingUser) {
                throw new Error("User already exists");
            }
        }

        if(data.username && data.username !== user.username) {
            const existingUser = await this.userRepo.findOneBy({ username: data.username });
            if (existingUser) {
                throw new Error("User already exists");
            }
        }

        Object.assign(user, data);
        return await this.userRepo.save(user);
    }
    async deleteUser(id: string): Promise<User | null> {
        const user = await this.userRepo.findOneBy({ id });
        if (!user) {
            throw new Error("User not found");
        }
        return await this.userRepo.remove(user);
    }
}
