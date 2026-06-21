const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RoyaltyPayout", function () {
  let registry, token, payout;
  let artist, collaborator, payer, stranger;
  let songId;

  beforeEach(async function () {
    [artist, collaborator, payer, stranger] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("AudioBitsRegistry");
    registry = await Registry.deploy();

    const Token = await ethers.getContractFactory("MockERC20");
    token = await Token.deploy();

    const Payout = await ethers.getContractFactory("RoyaltyPayout");
    payout = await Payout.deploy(await registry.getAddress(), await token.getAddress());

    await registry.connect(artist).registerArtist("DJ One");
    await registry.connect(artist).registerSong("Track One", ethers.id("file-1"));
    songId = 1n;

    await token.mint(payer.address, ethers.parseEther("1000"));
    await token.connect(payer).approve(await payout.getAddress(), ethers.parseEther("1000"));
  });

  describe("payRoyalty without a split", function () {
    it("credits 100% to the song's registered artist", async function () {
      await expect(payout.connect(payer).payRoyalty(songId, ethers.parseEther("100")))
        .to.emit(payout, "RoyaltyPaid")
        .withArgs(songId, payer.address, ethers.parseEther("100"));

      expect(await payout.pendingBalance(artist.address)).to.equal(ethers.parseEther("100"));
    });

    it("reverts for a song that doesn't exist", async function () {
      await expect(payout.connect(payer).payRoyalty(999, ethers.parseEther("1"))).to.be.revertedWithCustomError(
        registry,
        "SongNotFound"
      );
    });

    it("reverts when paying zero", async function () {
      await expect(payout.connect(payer).payRoyalty(songId, 0)).to.be.revertedWithCustomError(
        payout,
        "ZeroAmount"
      );
    });
  });

  describe("setSplit", function () {
    it("lets the song's artist configure a split", async function () {
      await expect(
        payout.connect(artist).setSplit(songId, [artist.address, collaborator.address], [7000, 3000])
      )
        .to.emit(payout, "SplitSet")
        .withArgs(songId, [artist.address, collaborator.address], [7000n, 3000n]);

      const [payees, shares] = await payout.getSplit(songId);
      expect(payees).to.deep.equal([artist.address, collaborator.address]);
      expect(shares).to.deep.equal([7000n, 3000n]);
    });

    it("rejects calls from anyone other than the song's artist", async function () {
      await expect(
        payout.connect(stranger).setSplit(songId, [artist.address], [10000])
      ).to.be.revertedWithCustomError(payout, "NotSongArtist");
    });

    it("rejects shares that don't sum to 10000", async function () {
      await expect(
        payout.connect(artist).setSplit(songId, [artist.address, collaborator.address], [7000, 1000])
      ).to.be.revertedWithCustomError(payout, "InvalidSplit");
    });

    it("rejects mismatched array lengths", async function () {
      await expect(
        payout.connect(artist).setSplit(songId, [artist.address, collaborator.address], [10000])
      ).to.be.revertedWithCustomError(payout, "InvalidSplit");
    });

    it("rejects a zero address payee", async function () {
      await expect(
        payout.connect(artist).setSplit(songId, [ethers.ZeroAddress], [10000])
      ).to.be.revertedWithCustomError(payout, "InvalidSplit");
    });
  });

  describe("payRoyalty with a split", function () {
    beforeEach(async function () {
      await payout.connect(artist).setSplit(songId, [artist.address, collaborator.address], [7000, 3000]);
    });

    it("splits the payment proportionally, with rounding remainder to the last payee", async function () {
      await payout.connect(payer).payRoyalty(songId, 1001n);

      // 70% of 1001 = 700.7 -> floors to 700; remainder (301) goes to the last payee.
      expect(await payout.pendingBalance(artist.address)).to.equal(700n);
      expect(await payout.pendingBalance(collaborator.address)).to.equal(301n);
    });
  });

  describe("withdraw", function () {
    it("transfers the full pending balance to the caller and zeroes it out", async function () {
      await payout.connect(payer).payRoyalty(songId, ethers.parseEther("50"));

      await expect(payout.connect(artist).withdraw()).to.changeTokenBalances(
        token,
        [artist, payout],
        [ethers.parseEther("50"), -ethers.parseEther("50")]
      );

      expect(await payout.pendingBalance(artist.address)).to.equal(0n);
    });

    it("reverts when there is nothing to withdraw", async function () {
      await expect(payout.connect(stranger).withdraw()).to.be.revertedWithCustomError(
        payout,
        "NothingToWithdraw"
      );
    });
  });
});
