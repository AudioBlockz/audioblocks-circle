import { In } from "typeorm";
import AppDataSource from "../config/db";
import { User, UserRole } from "../entities/User";
import { Song } from "../entities/Song";
import { Collection, CollectionStatus } from "../entities/Collection";
import {
  CollectionMember,
  CollectionMemberStatus,
} from "../entities/CollectionMember";
import { signS3Url } from "../utils/s3";
import { CollectionMemberInputDTO } from "../dtos/CreateCollectionDTO";

const TOTAL_SPLIT_BPS = 10000;

export class CollectionService {
  private collectionRepo = AppDataSource.getRepository(Collection);
  private memberRepo = AppDataSource.getRepository(CollectionMember);
  private userRepo = AppDataSource.getRepository(User);
  private songRepo = AppDataSource.getRepository(Song);

  async createCollection(
    creator: User,
    title: string,
    description: string | undefined,
    creatorSplitBps: number,
    members: CollectionMemberInputDTO[]
  ) {
    const invitedIds = members.map((m) => m.userId);
    if (invitedIds.includes(creator.id)) {
      throw new Error(
        "CollectionService: creator is included automatically, don't list yourself in members"
      );
    }
    if (new Set(invitedIds).size !== invitedIds.length) {
      throw new Error("CollectionService: duplicate member in invite list");
    }

    const totalBps =
      creatorSplitBps + members.reduce((sum, m) => sum + m.splitBps, 0);
    if (totalBps !== TOTAL_SPLIT_BPS) {
      throw new Error(
        `CollectionService: splits must sum to 100% (10000 bps), got ${totalBps}`
      );
    }

    const invitedArtists = await this.userRepo.findBy({
      id: In(invitedIds),
      role: UserRole.ARTIST,
    });
    if (invitedArtists.length !== invitedIds.length) {
      throw new Error(
        "CollectionService: one or more invited members are not registered artists"
      );
    }

    const collection = await this.collectionRepo.save(
      this.collectionRepo.create({
        creatorId: creator.id,
        title,
        description,
        status: CollectionStatus.DRAFT,
      })
    );

    const now = new Date();
    const memberRows = [
      this.memberRepo.create({
        collectionId: collection.id,
        userId: creator.id,
        splitBps: creatorSplitBps,
        status: CollectionMemberStatus.ACCEPTED,
        invitedBy: creator.id,
        respondedAt: now,
      }),
      ...members.map((m) =>
        this.memberRepo.create({
          collectionId: collection.id,
          userId: m.userId,
          splitBps: m.splitBps,
          status: CollectionMemberStatus.PENDING,
          invitedBy: creator.id,
        })
      ),
    ];
    await this.memberRepo.save(memberRows);

    return this.getCollectionById(collection.id, creator.id);
  }

  // Collections where the user is the creator or an invited/accepted member.
  async listMyCollections(userId: string) {
    const memberships = await this.memberRepo.find({ where: { userId } });
    if (memberships.length === 0) return [];

    const collections = await this.collectionRepo.findBy({
      id: In(memberships.map((m) => m.collectionId)),
    });

    return Promise.all(
      collections.map((c) => this.serializeCollection(c))
    );
  }

  async listPendingInvites(userId: string) {
    const pending = await this.memberRepo.find({
      where: { userId, status: CollectionMemberStatus.PENDING },
    });
    if (pending.length === 0) return [];

    const collections = await this.collectionRepo.findBy({
      id: In(pending.map((m) => m.collectionId)),
    });
    const collectionById = new Map(collections.map((c) => [c.id, c]));

    return Promise.all(
      pending.map(async (m) => {
        const collection = collectionById.get(m.collectionId);
        const creator = collection
          ? await this.userRepo.findOneBy({ id: collection.creatorId })
          : null;
        return {
          collectionId: m.collectionId,
          title: collection?.title ?? null,
          description: collection?.description ?? null,
          splitBps: m.splitBps,
          invitedBy: creator
            ? {
                id: creator.id,
                username: creator.username,
                name: creator.name,
                profileImage: signS3Url(creator.profileImage),
              }
            : null,
          createdAt: m.createdAt,
        };
      })
    );
  }

  async getCollectionById(collectionId: string, requestingUserId: string) {
    const collection = await this.collectionRepo.findOneBy({ id: collectionId });
    if (!collection) {
      throw new Error("CollectionService: collection not found");
    }

    const membership = await this.memberRepo.findOne({
      where: { collectionId, userId: requestingUserId },
    });
    if (!membership) {
      throw new Error("CollectionService: you are not a member of this collection");
    }

    return this.serializeCollection(collection);
  }

  // Accept/decline a pending invite. Accepting the last pending member
  // flips the collection draft -> active, unlocking song uploads for it.
  async respondToInvite(
    userId: string,
    collectionId: string,
    status: "accepted" | "declined"
  ) {
    const membership = await this.memberRepo.findOne({
      where: { collectionId, userId },
    });
    if (!membership) {
      throw new Error("CollectionService: no invite found for this collection");
    }
    if (membership.status !== CollectionMemberStatus.PENDING) {
      throw new Error("CollectionService: this invite has already been responded to");
    }

    membership.status =
      status === "accepted"
        ? CollectionMemberStatus.ACCEPTED
        : CollectionMemberStatus.DECLINED;
    membership.respondedAt = new Date();
    await this.memberRepo.save(membership);

    const collection = await this.collectionRepo.findOneBy({ id: collectionId });
    if (!collection) {
      throw new Error("CollectionService: collection not found");
    }

    if (status === "accepted" && collection.status === CollectionStatus.DRAFT) {
      const allMembers = await this.memberRepo.find({ where: { collectionId } });
      const allAccepted = allMembers.every(
        (m) => m.status === CollectionMemberStatus.ACCEPTED
      );
      if (allAccepted) {
        collection.status = CollectionStatus.ACTIVE;
        await this.collectionRepo.save(collection);
      }
    }

    return this.serializeCollection(collection);
  }

  // Tags an existing song (already uploaded/owned by this artist) as part
  // of an active collection, so its rewards split via CollectionMember
  // instead of paying the uploading artist alone.
  async attachSong(userId: string, songId: string, collectionId: string) {
    const collection = await this.collectionRepo.findOneBy({ id: collectionId });
    if (!collection) {
      throw new Error("CollectionService: collection not found");
    }
    if (collection.status !== CollectionStatus.ACTIVE) {
      throw new Error(
        "CollectionService: collection must be active (every member accepted) before songs can be added"
      );
    }

    const membership = await this.memberRepo.findOne({
      where: { collectionId, userId, status: CollectionMemberStatus.ACCEPTED },
    });
    if (!membership) {
      throw new Error("CollectionService: you are not an accepted member of this collection");
    }

    const song = await this.songRepo.findOneBy({ id: songId });
    if (!song) {
      throw new Error("CollectionService: song not found");
    }
    if (song.artistId !== userId) {
      throw new Error("CollectionService: you can only attach your own songs");
    }

    song.collectionId = collectionId;
    await this.songRepo.save(song);

    return { songId: song.id, collectionId };
  }

  private async serializeCollection(collection: Collection) {
    const members = await this.memberRepo.find({ where: { collectionId: collection.id } });
    const users = await this.userRepo.findBy({ id: In(members.map((m) => m.userId)) });
    const userById = new Map(users.map((u) => [u.id, u]));

    return {
      id: collection.id,
      title: collection.title,
      description: collection.description,
      status: collection.status,
      creatorId: collection.creatorId,
      createdAt: collection.createdAt,
      members: members.map((m) => {
        const u = userById.get(m.userId);
        return {
          userId: m.userId,
          username: u?.username ?? null,
          name: u?.name ?? null,
          profileImage: u ? signS3Url(u.profileImage) : null,
          splitBps: m.splitBps,
          status: m.status,
          respondedAt: m.respondedAt ?? null,
        };
      }),
    };
  }
}
