const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AudioBitsRegistry", function () {
  let registry, owner, artist1, artist2, stranger;

  beforeEach(async function () {
    [owner, artist1, artist2, stranger] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("AudioBitsRegistry");
    registry = await Registry.deploy();
  });

  describe("registerArtist", function () {
    it("registers a new artist with an incrementing ID starting at 1", async function () {
      await expect(registry.connect(artist1).registerArtist("DJ One"))
        .to.emit(registry, "ArtistRegistered")
        .withArgs(1n, artist1.address, "DJ One");

      const artist = await registry.getArtist(1);
      expect(artist.name).to.equal("DJ One");
      expect(artist.wallet).to.equal(artist1.address);
      expect(await registry.artistByWallet(artist1.address)).to.equal(1n);
    });

    it("assigns sequential IDs to different artists", async function () {
      await registry.connect(artist1).registerArtist("DJ One");
      await registry.connect(artist2).registerArtist("DJ Two");

      expect(await registry.artistByWallet(artist1.address)).to.equal(1n);
      expect(await registry.artistByWallet(artist2.address)).to.equal(2n);
    });

    it("rejects an empty name", async function () {
      await expect(registry.connect(artist1).registerArtist("")).to.be.revertedWithCustomError(
        registry,
        "InvalidName"
      );
    });

    it("rejects a name longer than 50 characters", async function () {
      const longName = "a".repeat(51);
      await expect(registry.connect(artist1).registerArtist(longName)).to.be.revertedWithCustomError(
        registry,
        "NameTooLong"
      );
    });

    it("rejects double registration from the same wallet", async function () {
      await registry.connect(artist1).registerArtist("DJ One");
      await expect(registry.connect(artist1).registerArtist("DJ One Again")).to.be.revertedWithCustomError(
        registry,
        "AlreadyRegistered"
      );
    });
  });

  describe("registerSong", function () {
    beforeEach(async function () {
      await registry.connect(artist1).registerArtist("DJ One");
    });

    it("registers a song for a registered artist", async function () {
      const hash = ethers.id("song-file-1");
      await expect(registry.connect(artist1).registerSong("Track One", hash))
        .to.emit(registry, "SongRegistered")
        .withArgs(1n, 1n, hash, "Track One");

      const song = await registry.getSong(1);
      expect(song.title).to.equal("Track One");
      expect(song.artistId).to.equal(1n);
      expect(song.fileHash).to.equal(hash);
      expect(await registry.fileHashToSong(hash)).to.equal(1n);
    });

    it("rejects songs from a wallet that is not a registered artist", async function () {
      const hash = ethers.id("song-file-2");
      await expect(registry.connect(stranger).registerSong("Track Two", hash)).to.be.revertedWithCustomError(
        registry,
        "NotArtist"
      );
    });

    it("rejects an empty title", async function () {
      const hash = ethers.id("song-file-3");
      await expect(registry.connect(artist1).registerSong("", hash)).to.be.revertedWithCustomError(
        registry,
        "InvalidName"
      );
    });

    it("rejects a title longer than 100 characters", async function () {
      const hash = ethers.id("song-file-4");
      const longTitle = "a".repeat(101);
      await expect(registry.connect(artist1).registerSong(longTitle, hash)).to.be.revertedWithCustomError(
        registry,
        "NameTooLong"
      );
    });

    it("rejects duplicate file hashes, even across different artists", async function () {
      await registry.connect(artist2).registerArtist("DJ Two");
      const hash = ethers.id("shared-file");

      await registry.connect(artist1).registerSong("Original", hash);
      await expect(registry.connect(artist2).registerSong("Copycat", hash)).to.be.revertedWithCustomError(
        registry,
        "DuplicateFileHash"
      );
    });
  });

  describe("getSong / getArtist", function () {
    it("reverts when querying a song ID that does not exist", async function () {
      await expect(registry.getSong(999)).to.be.revertedWithCustomError(registry, "SongNotFound");
    });

    it("reverts when querying an artist ID that does not exist", async function () {
      await expect(registry.getArtist(999)).to.be.revertedWithCustomError(registry, "ArtistNotFound");
    });

    it("reverts when looking up an unregistered wallet", async function () {
      await expect(registry.getArtistIdByWallet(stranger.address)).to.be.revertedWithCustomError(
        registry,
        "ArtistNotFound"
      );
    });
  });
});
