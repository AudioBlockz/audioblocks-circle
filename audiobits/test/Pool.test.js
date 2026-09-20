const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Pool", function () {
  let token, pool;
  let payoutAuthority, depositor, winnerA, winnerB, stranger;

  beforeEach(async function () {
    [payoutAuthority, depositor, winnerA, winnerB, stranger] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MockERC20");
    token = await Token.deploy();

    const Pool = await ethers.getContractFactory("Pool");
    pool = await Pool.deploy(await token.getAddress(), payoutAuthority.address);

    await token.mint(depositor.address, ethers.parseEther("1000"));
    await token.connect(depositor).approve(await pool.getAddress(), ethers.parseEther("1000"));
  });

  describe("deposit", function () {
    it("pulls the token in and emits Deposited with the new balance", async function () {
      await expect(pool.connect(depositor).deposit(ethers.parseEther("100")))
        .to.emit(pool, "Deposited")
        .withArgs(depositor.address, ethers.parseEther("100"), ethers.parseEther("100"));

      expect(await token.balanceOf(await pool.getAddress())).to.equal(ethers.parseEther("100"));
    });

    it("reverts when depositing zero", async function () {
      await expect(pool.connect(depositor).deposit(0)).to.be.revertedWithCustomError(pool, "ZeroAmount");
    });

    it("reverts without a prior approval", async function () {
      await expect(pool.connect(stranger).deposit(1)).to.be.reverted;
    });
  });

  describe("payout", function () {
    beforeEach(async function () {
      await pool.connect(depositor).deposit(ethers.parseEther("100"));
    });

    it("lets the payout authority pay a set of winners and emits PaidOut", async function () {
      await expect(
        pool
          .connect(payoutAuthority)
          .payout([winnerA.address, winnerB.address], [ethers.parseEther("40"), ethers.parseEther("60")])
      )
        .to.emit(pool, "PaidOut")
        .withArgs(
          [winnerA.address, winnerB.address],
          [ethers.parseEther("40"), ethers.parseEther("60")],
          ethers.parseEther("100")
        );

      expect(await token.balanceOf(winnerA.address)).to.equal(ethers.parseEther("40"));
      expect(await token.balanceOf(winnerB.address)).to.equal(ethers.parseEther("60"));
    });

    it("leaves unpaid remainder dust in the pool", async function () {
      await pool.connect(payoutAuthority).payout([winnerA.address], [ethers.parseEther("99")]);
      expect(await token.balanceOf(await pool.getAddress())).to.equal(ethers.parseEther("1"));
    });

    it("rejects calls from anyone other than the payout authority", async function () {
      await expect(
        pool.connect(stranger).payout([winnerA.address], [ethers.parseEther("1")])
      ).to.be.revertedWithCustomError(pool, "NotPayoutAuthority");
    });

    it("rejects an empty winners array", async function () {
      await expect(pool.connect(payoutAuthority).payout([], [])).to.be.revertedWithCustomError(
        pool,
        "NoWinners"
      );
    });

    it("rejects mismatched array lengths", async function () {
      await expect(
        pool.connect(payoutAuthority).payout([winnerA.address, winnerB.address], [ethers.parseEther("1")])
      ).to.be.revertedWithCustomError(pool, "ArrayLengthMismatch");
    });

    it("rejects a total exceeding the pool's balance", async function () {
      await expect(
        pool.connect(payoutAuthority).payout([winnerA.address], [ethers.parseEther("101")])
      ).to.be.revertedWithCustomError(pool, "InsufficientBalance");
    });

    it("skips zero-amount entries without reverting", async function () {
      await pool
        .connect(payoutAuthority)
        .payout([winnerA.address, winnerB.address], [ethers.parseEther("100"), 0]);
      expect(await token.balanceOf(winnerB.address)).to.equal(0n);
      expect(await token.balanceOf(winnerA.address)).to.equal(ethers.parseEther("100"));
    });
  });
});
