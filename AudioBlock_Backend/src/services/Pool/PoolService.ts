import { erc20Abi, parseUnits, formatUnits } from "viem";
import { In } from "typeorm";
import AppDataSource from "../../config/db";
import { User, UserRole } from "../../entities/User";
import { PoolRound, PoolRoundStatus } from "../../entities/PoolRound";
import { PoolDeposit } from "../../entities/PoolDeposit";
import { Vote } from "../../entities/Vote";
import { PoolRoundResult } from "../../entities/PoolRoundResult";
import { Collection, CollectionStatus } from "../../entities/Collection";
import { CollectionMember, CollectionMemberStatus } from "../../entities/CollectionMember";
import { Song } from "../../entities/Song";
import { ArcContractAddress } from "../../utils/arcContracts";
import { PoolABI } from "../../abis/Pool";
import { sendCircleContractTransaction } from "../../utils/circleWallet";
import { arcPublicClient } from "../../config/arc";
import { TransactionLogService } from "../TransactionLogService";
import { signS3Url } from "../../utils/s3";

// Real USDC (Arc Testnet's native-currency-backed precompile, see
// arcContracts.ts) uses 6 decimals. Every amount conversion in this
// service goes through this constant so it stays consistent.
const TOKEN_DECIMALS = 6;
const TOP_N_WINNERS = 5;

// How long a round stays open before autoCloseDueRounds() closes it —
// tunable per deploy; only affects rounds opened after a change (see
// PoolRound.closesAt). Defaults to a week if unset.
const POOL_ROUND_DURATION_HOURS = Number(process.env.POOL_ROUND_DURATION_HOURS || 24 * 7);

export class PoolService {
  private roundRepo = AppDataSource.getRepository(PoolRound);
  private depositRepo = AppDataSource.getRepository(PoolDeposit);
  private voteRepo = AppDataSource.getRepository(Vote);
  private resultRepo = AppDataSource.getRepository(PoolRoundResult);
  private userRepo = AppDataSource.getRepository(User);
  private collectionRepo = AppDataSource.getRepository(Collection);
  private collectionMemberRepo = AppDataSource.getRepository(CollectionMember);
  private songRepo = AppDataSource.getRepository(Song);
  private transactionLogService = new TransactionLogService();

  // The currently open round, if any — voting/deposits pause between a
  // round closing and an admin explicitly opening the next one (see
  // createRound below), so this can legitimately return null.
  async getOpenRound(): Promise<PoolRound | null> {
    return this.roundRepo.findOne({ where: { status: PoolRoundStatus.OPEN } });
  }

  // Admin-only: opens the next round. Rounds no longer open themselves —
  // an admin decides when voting starts again after the previous one
  // closes, and picks (or accepts the default) duration for how long it
  // stays open before autoCloseDueRounds() closes and pays it out.
  async createRound(durationHours?: number): Promise<PoolRound> {
    const existing = await this.getOpenRound();
    if (existing) {
      throw new Error(`PoolService: round #${existing.roundNumber} is already open — close it before starting a new one`);
    }

    const hours = durationHours ?? POOL_ROUND_DURATION_HOURS;
    if (!Number.isFinite(hours) || hours <= 0) {
      throw new Error("PoolService: durationHours must be a positive number");
    }

    const last = await this.roundRepo.findOne({ where: {}, order: { roundNumber: "DESC" } });
    const round = this.roundRepo.create({
      roundNumber: (last?.roundNumber ?? 0) + 1,
      status: PoolRoundStatus.OPEN,
      totalDeposited: "0",
      closesAt: new Date(Date.now() + hours * 60 * 60 * 1000),
    });
    return this.roundRepo.save(round);
  }

  // Called on a timer (see index.ts) — closes any OPEN round whose
  // closesAt has passed, the same way an admin closing it manually would
  // (tally, payout, snapshot, open the next one). One round's failure
  // (e.g. a transient RPC error mid-payout) is logged and skipped rather
  // than blocking the others, since the next tick will just retry it.
  async autoCloseDueRounds(): Promise<void> {
    const due = await this.roundRepo
      .createQueryBuilder("r")
      .where("r.status = :status", { status: PoolRoundStatus.OPEN })
      .andWhere("r.closesAt IS NOT NULL")
      .andWhere("r.closesAt <= :now", { now: new Date() })
      .getMany();

    for (const round of due) {
      try {
        await this.closeRound(round.id, null);
        console.log(`Auto-closed pool round #${round.roundNumber}`);
      } catch (err) {
        console.error(`Failed to auto-close pool round #${round.roundNumber}:`, err);
      }
    }
  }

  async listArtists() {
    const artists = await this.userRepo.find({ where: { role: UserRole.ARTIST } });
    return artists.map((a) => ({
      id: a.id,
      username: a.username,
      name: a.name,
      profileImage: signS3Url(a.profileImage),
      bio: a.bio,
    }));
  }

  // The voteable catalogue for the "Vote" tab — every released song, with
  // enough artist/collab context to render without a second round-trip.
  async listSongs() {
    const songs = await this.songRepo.find({ where: { status: "ready", unreleased: false } });
    return this.enrichSongs(songs);
  }

  // Live per-song vote tally for the round currently open — every released
  // song appears (0 votes included), sorted highest-first, so the
  // leaderboard can show where things stand before a round closes rather
  // than only ever showing past, already-closed rounds.
  async getCurrentStandings() {
    const round = await this.getOpenRound();
    const songs = await this.songRepo.find({ where: { status: "ready", unreleased: false } });
    const votes = round ? await this.voteRepo.find({ where: { roundId: round.id } }) : [];

    const voteCountBySongId = new Map<string, number>();
    for (const v of votes) {
      voteCountBySongId.set(v.songId, (voteCountBySongId.get(v.songId) ?? 0) + 1);
    }

    const enriched = await this.enrichSongs(songs);
    return enriched
      .map((s) => ({ ...s, voteCount: voteCountBySongId.get(s.id) ?? 0 }))
      .sort((a, b) => b.voteCount - a.voteCount);
  }

  private async enrichSongs(songs: Song[]) {
    const artists = await this.userRepo.findBy({ id: In(songs.map((s) => s.artistId)) });
    const artistById = new Map(artists.map((a) => [a.id, a]));

    const collectionIds = songs.map((s) => s.collectionId).filter((id): id is string => !!id);
    const collections =
      collectionIds.length > 0
        ? await this.collectionRepo.findBy({ id: In(collectionIds), status: CollectionStatus.ACTIVE })
        : [];
    const collectionById = new Map(collections.map((c) => [c.id, c]));

    return songs.map((s) => {
      const artist = artistById.get(s.artistId);
      const collection = s.collectionId ? collectionById.get(s.collectionId) : undefined;
      return {
        id: s.id,
        title: s.title,
        coverArtPath: signS3Url(s.coverArtPath),
        artist: artist
          ? { id: artist.id, username: artist.username, name: artist.name }
          : { id: s.artistId, username: null, name: null },
        collab: collection ? { id: collection.id, title: collection.title } : null,
      };
    });
  }

  // Null means no round is currently open (between an admin closing one and
  // opening the next) — the frontend shows a "no active round" state rather
  // than treating this as an error.
  async getCurrentRoundStatus(userId?: string) {
    const round = await this.getOpenRound();
    if (!round) return null;

    const base = {
      roundId: round.id,
      roundNumber: round.roundNumber,
      status: round.status,
      openedAt: round.openedAt,
      closesAt: round.closesAt ?? null,
      totalDeposited: formatUnits(BigInt(round.totalDeposited), TOKEN_DECIMALS),
    };

    if (!userId) return base;

    const myVote = await this.voteRepo.findOne({ where: { userId, roundId: round.id } });
    return { ...base, hasVoted: !!myVote, votedSongId: myVote?.songId ?? null };
  }

  async castVote(userId: string, songId: string): Promise<void> {
    const song = await this.songRepo.findOne({ where: { id: songId, status: "ready", unreleased: false } });
    if (!song) {
      throw new Error("PoolService: song not found or not yet released");
    }

    const round = await this.getOpenRound();
    if (!round) {
      throw new Error("PoolService: no round is currently open for voting");
    }

    const existing = await this.voteRepo.findOne({ where: { userId, roundId: round.id } });
    if (existing) {
      existing.songId = songId;
      await this.voteRepo.save(existing);
      return;
    }

    const vote = this.voteRepo.create({ userId, songId, roundId: round.id });
    await this.voteRepo.save(vote);
  }

  // Runs both on-chain steps itself (approve, then deposit), signed with
  // the caller's own Circle developer-controlled wallet — same 2-step
  // ERC20 flow any contract-mediated deposit needs, just server-initiated
  // instead of client-initiated (this codebase has no client-side
  // wallet-write code; see the "Migrate Off Privy" plan's Phase B for why
  // that would need to change for a real user-controlled signing model).
  async deposit(user: User, amountHuman: string) {
    const round = await this.getOpenRound();
    if (!round) {
      throw new Error("PoolService: no round is currently open for deposits");
    }
    return this.executeDeposit(user.walletAddress, user.id, amountHuman, round.id, "POOL_DEPOSIT");
  }

  // Same on-chain approve+deposit, but signed by the platform's own
  // treasury Circle wallet instead of the listener's — for a deposit that
  // was actually paid in fiat (Stripe/Paystack), where there is no listener
  // wallet holding real USDC to sign from. Called only from a verified
  // payment-provider webhook (see FiatDepositService), never directly from
  // a request a listener controls. `roundId` is the round that was open
  // when the listener started checkout, not necessarily whatever is open
  // now — a round closing mid-payment shouldn't silently redirect their
  // money into the next one.
  async depositFromTreasury(userId: string, amountHuman: string, roundId: string) {
    const treasuryAddress = process.env.TREASURY_WALLET_ADDRESS;
    if (!treasuryAddress) {
      throw new Error("PoolService: TREASURY_WALLET_ADDRESS is not configured");
    }
    return this.executeDeposit(treasuryAddress, userId, amountHuman, roundId, "POOL_DEPOSIT_FIAT");
  }

  // Runs both on-chain steps itself (approve, then deposit), signed with
  // whichever Circle wallet the caller specifies — same 2-step ERC20 flow
  // any contract-mediated deposit needs, just server-initiated instead of
  // client-initiated (this codebase has no client-side wallet-write code;
  // see the "Migrate Off Privy" plan's Phase B for why that would need to
  // change for a real user-controlled signing model).
  private async executeDeposit(
    signerWalletAddress: string,
    creditUserId: string,
    amountHuman: string,
    roundId: string,
    logAction: string
  ) {
    const amount = parseUnits(amountHuman, TOKEN_DECIMALS);
    if (amount <= 0n) {
      throw new Error("PoolService: deposit amount must be greater than zero");
    }

    const round = await this.roundRepo.findOne({ where: { id: roundId } });
    if (!round) {
      throw new Error("PoolService: round not found");
    }

    const approveTxHash = await sendCircleContractTransaction({
      walletAddress: signerWalletAddress,
      to: ArcContractAddress.PaymentToken,
      abi: erc20Abi,
      functionName: "approve",
      args: [ArcContractAddress.Pool, amount],
    });

    const depositTxHash = await sendCircleContractTransaction({
      walletAddress: signerWalletAddress,
      to: ArcContractAddress.Pool,
      abi: PoolABI,
      functionName: "deposit",
      args: [amount],
    });

    const deposit = this.depositRepo.create({
      userId: creditUserId,
      roundId: round.id,
      amount: amount.toString(),
      approveTxHash,
      depositTxHash,
    });
    await this.depositRepo.save(deposit);

    round.totalDeposited = (BigInt(round.totalDeposited) + amount).toString();
    await this.roundRepo.save(round);

    await this.transactionLogService.createLogEntry(
      creditUserId,
      depositTxHash,
      logAction,
      `Deposited ${amountHuman} into pool round #${round.roundNumber}`
    );

    return { approveTxHash, depositTxHash, amount: amountHuman, roundId: round.id };
  }

  async listClosedRounds(limit = 20) {
    const rounds = await this.roundRepo.find({
      where: { status: PoolRoundStatus.CLOSED },
      order: { closedAt: "DESC" },
      take: limit,
    });
    return rounds.map((r) => ({
      id: r.id,
      roundNumber: r.roundNumber,
      totalDeposited: formatUnits(BigInt(r.totalDeposited), TOKEN_DECIMALS),
      payoutTxHash: r.payoutTxHash,
      closedAt: r.closedAt,
    }));
  }

  async getRoundResults(roundId: string) {
    const results = await this.resultRepo.find({ where: { roundId }, order: { rank: "ASC" } });
    if (results.length === 0) return [];

    const artists = await this.userRepo.findBy({ id: In(results.map((r) => r.artistId)) });
    const artistById = new Map(artists.map((a) => [a.id, a]));

    const songIds = results.map((r) => r.songId).filter((id): id is string => !!id);
    const songs = songIds.length > 0 ? await this.songRepo.findBy({ id: In(songIds) }) : [];
    const songById = new Map(songs.map((s) => [s.id, s]));

    return results.map((r) => {
      const artist = artistById.get(r.artistId);
      const song = r.songId ? songById.get(r.songId) : undefined;
      return {
        rank: r.rank,
        song: song ? { id: song.id, title: song.title, coverArtPath: signS3Url(song.coverArtPath) } : null,
        artist: artist
          ? { id: artist.id, username: artist.username, name: artist.name, profileImage: signS3Url(artist.profileImage) }
          : { id: r.artistId, username: null, name: null, profileImage: null },
        voteCount: r.voteCount,
        amountPaid: formatUnits(BigInt(r.amountPaid), TOKEN_DECIMALS),
      };
    });
  }

  async listAllRoundsForAdmin() {
    const rounds = await this.roundRepo.find({ order: { roundNumber: "DESC" } });
    return Promise.all(
      rounds.map(async (r) => {
        const [voteCount, depositCount] = await Promise.all([
          this.voteRepo.count({ where: { roundId: r.id } }),
          this.depositRepo.count({ where: { roundId: r.id } }),
        ]);
        return {
          id: r.id,
          roundNumber: r.roundNumber,
          status: r.status,
          totalDeposited: formatUnits(BigInt(r.totalDeposited), TOKEN_DECIMALS),
          voteCount,
          depositCount,
          openedAt: r.openedAt,
          closesAt: r.closesAt ?? null,
          closedAt: r.closedAt,
        };
      })
    );
  }

  // The core round-closing action: tally votes, pick the top N, pay them out
  // on-chain, snapshot the result, and open the next round. adminUser is
  // null when autoCloseDueRounds() triggers this instead of an admin
  // manually hitting the close endpoint — only used below for log
  // attribution, never for authorization (that's the route's admin gate).
  async closeRound(roundId: string, adminUser: User | null) {
    const round = await this.roundRepo.findOne({ where: { id: roundId } });
    if (!round) {
      throw new Error("PoolService: round not found");
    }
    if (round.status !== PoolRoundStatus.OPEN) {
      throw new Error("PoolService: round is not open");
    }

    const standings: { songId: string; votes: string }[] = await this.voteRepo
      .createQueryBuilder("v")
      .select("v.songId", "songId")
      .addSelect("COUNT(*)", "votes")
      .where("v.roundId = :roundId", { roundId })
      .groupBy("v.songId")
      .orderBy("votes", "DESC")
      .limit(TOP_N_WINNERS)
      .getRawMany();

    if (standings.length === 0) {
      round.status = PoolRoundStatus.CLOSED;
      round.closedAt = new Date();
      await this.roundRepo.save(round);
      return { round: this.serializeRound(round), payoutTxHash: null, winners: [] };
    }

    const winningSongs = await this.songRepo.findBy({ id: In(standings.map((s) => s.songId)) });
    const songById = new Map(winningSongs.map((sg) => [sg.id, sg]));

    const winners = await this.userRepo.findBy({ id: In(winningSongs.map((sg) => sg.artistId)) });
    const winnerById = new Map(winners.map((w) => [w.id, w]));

    // Source of truth for the payout amount is the contract's real
    // balance, not PoolRound.totalDeposited (a fast display approximation
    // that can drift from failed txs or prior-round dust).
    const poolBalance = (await arcPublicClient.readContract({
      address: ArcContractAddress.PaymentToken,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [ArcContractAddress.Pool],
    })) as bigint;

    const amountEach = poolBalance / BigInt(standings.length);

    // A winning song that belongs to an active collaboration has its share
    // split across that collaboration's members instead of paid solely to
    // the uploading artist — see getSongCollaborationSplit. Because voting
    // targets a specific song, there's no ambiguity about which
    // collaboration (if any) a win applies to.
    const payoutAddresses: `0x${string}`[] = [];
    const payoutAmounts: bigint[] = [];
    const collabSplitsApplied: {
      songId: string;
      collectionTitle: string;
      members: { userId: string; amount: string }[];
    }[] = [];

    for (const s of standings) {
      const song = songById.get(s.songId);
      if (!song) throw new Error(`PoolService: winning song ${s.songId} not found`);
      const w = winnerById.get(song.artistId);
      if (!w) throw new Error(`PoolService: artist ${song.artistId} for winning song ${s.songId} not found`);

      const collab = await this.getSongCollaborationSplit(song.collectionId);
      if (!collab) {
        payoutAddresses.push(w.walletAddress as `0x${string}`);
        payoutAmounts.push(amountEach);
        continue;
      }

      // Basis-point division floors, so the shares can undershoot amountEach
      // by a few base units — hand that dust to whichever member has the
      // largest split rather than leaving it stuck in the pool contract.
      const shares = collab.members.map((m) => (amountEach * BigInt(m.splitBps)) / 10000n);
      const distributed = shares.reduce((a, b) => a + b, 0n);
      const remainder = amountEach - distributed;
      const largestIdx = shares.reduce(
        (maxI, _s, i) => (collab.members[i].splitBps > collab.members[maxI].splitBps ? i : maxI),
        0
      );
      shares[largestIdx] += remainder;

      collab.members.forEach((m, i) => {
        payoutAddresses.push(m.address as `0x${string}`);
        payoutAmounts.push(shares[i]);
      });

      collabSplitsApplied.push({
        songId: s.songId,
        collectionTitle: collab.collectionTitle,
        members: collab.members.map((m, i) => ({ userId: m.userId, amount: shares[i].toString() })),
      });
    }

    // Signed by the Pool contract's own payout-authority Circle wallet, not
    // by adminUser's own wallet — adminUser is only checked for the
    // authAdminMiddleware role gate and logged below, not used to sign.
    const payoutTxHash = await sendCircleContractTransaction({
      walletAddress: process.env.CIRCLE_POOL_PAYOUT_WALLET_ADDRESS!,
      to: ArcContractAddress.Pool,
      abi: PoolABI,
      functionName: "payout",
      args: [payoutAddresses, payoutAmounts],
    });

    await this.resultRepo.save(
      standings.map((s, i) => {
        const song = songById.get(s.songId)!;
        return this.resultRepo.create({
          roundId: round.id,
          songId: s.songId,
          artistId: song.artistId,
          rank: i + 1,
          voteCount: Number(s.votes),
          amountPaid: amountEach.toString(),
        });
      })
    );

    round.status = PoolRoundStatus.CLOSED;
    round.closedAt = new Date();
    round.payoutTxHash = payoutTxHash;
    round.payoutAmountPerWinner = amountEach.toString();
    await this.roundRepo.save(round);

    await this.transactionLogService.createLogEntry(
      adminUser?.id ?? null,
      payoutTxHash,
      "POOL_ROUND_PAYOUT",
      `Paid out round #${round.roundNumber} to ${standings.length} winner(s)${adminUser ? "" : " (auto-closed)"}`
    );

    for (const split of collabSplitsApplied) {
      await this.transactionLogService.createLogEntry(
        adminUser?.id ?? null,
        payoutTxHash,
        "COLLAB_PAYOUT_SPLIT",
        `Round #${round.roundNumber} win for song ${split.songId} split across "${split.collectionTitle}" (${split.members.length} member(s))`
      );
    }

    return {
      round: this.serializeRound(round),
      payoutTxHash,
      winners: standings.map((s) => ({ songId: s.songId, votes: Number(s.votes) })),
    };
  }

  // Resolves a winning song's collaboration split, if it has one. Only
  // active collaborations count — a song attached to a draft/archived
  // collab (or none at all) pays its uploading artist directly. Unlike the
  // old artist-level heuristic, this is unambiguous: the winning song
  // itself names at most one collection.
  private async getSongCollaborationSplit(collectionId?: string): Promise<{
    collectionId: string;
    collectionTitle: string;
    members: { userId: string; address: string; splitBps: number }[];
  } | null> {
    if (!collectionId) return null;

    const collection = await this.collectionRepo.findOne({
      where: { id: collectionId, status: CollectionStatus.ACTIVE },
    });
    if (!collection) return null;

    const allMembers = await this.collectionMemberRepo.find({
      where: { collectionId: collection.id, status: CollectionMemberStatus.ACCEPTED },
    });
    if (allMembers.length === 0) return null;

    const users = await this.userRepo.findBy({ id: In(allMembers.map((m) => m.userId)) });
    const userById = new Map(users.map((u) => [u.id, u]));

    return {
      collectionId: collection.id,
      collectionTitle: collection.title,
      members: allMembers.map((m) => {
        const user = userById.get(m.userId);
        if (!user) throw new Error(`PoolService: collection member ${m.userId} not found`);
        return { userId: m.userId, address: user.walletAddress, splitBps: m.splitBps };
      }),
    };
  }

  private serializeRound(r: PoolRound) {
    return {
      id: r.id,
      roundNumber: r.roundNumber,
      status: r.status,
      totalDeposited: formatUnits(BigInt(r.totalDeposited), TOKEN_DECIMALS),
      payoutTxHash: r.payoutTxHash,
      closesAt: r.closesAt ?? null,
      closedAt: r.closedAt,
    };
  }
}
