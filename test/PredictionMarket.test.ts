2import { expect } from "chai";
import { ethers } from "hardhat";
import { PredictionMarket } from "../typechain/PredictionMarket";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("PredictionMarket", function () {
  let predictionMarket: PredictionMarket;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    const PredictionMarketFactory = await ethers.getContractFactory("PredictionMarket");
    predictionMarket = (await PredictionMarketFactory.deploy()) as PredictionMarket;
    await predictionMarket.deployed();
  });

  describe("Market Creation", function () {
    it("Should create a market with correct details", async function () {
      const question = "Will ETH price exceed $5000 by end of year?";
      
      const tx = await predictionMarket.createMarket(question);
      const receipt = await tx.wait();
      
      // Check if MarketCreated event was emitted
      const event = receipt.events?.find(e => e.event === "MarketCreated");
      expect(event).to.not.be.undefined;
      expect(event?.args?.question).to.equal(question);
      expect(event?.args?.id).to.equal(1);
      
      // Check if market was created correctly
      const market = await predictionMarket.getMarket(1);
      expect(market.id).to.equal(1);
      expect(market.question).to.equal(question);
      expect(market.totalYesBets).to.equal(0);
      expect(market.totalNoBets).to.equal(0);
      expect(market.resolved).to.be.false;
    });

    it("Should increment market ID for each new market", async function () {
      await predictionMarket.createMarket("First question");
      await predictionMarket.createMarket("Second question");
      
      const market1 = await predictionMarket.getMarket(1);
      const market2 = await predictionMarket.getMarket(2);
      
      expect(market1.id).to.equal(1);
      expect(market2.id).to.equal(2);
    });

    it("Should fail if non-owner tries to create a market", async function () {
      const question = "Will BTC reach $100k?";
      
      await expect(
        predictionMarket.connect(user1).createMarket(question)
      ).to.be.revertedWith("OnlyOwner()");
    });
  });

  describe("Placing Bets", function () {
    beforeEach(async function () {
      await predictionMarket.createMarket("Will it rain tomorrow?");
    });

    it("Should place a Yes bet correctly", async function () {
      const betAmount = ethers.utils.parseEther("1");
      
      const tx = await predictionMarket.connect(user1).betYes(1, { value: betAmount });
      const receipt = await tx.wait();
      
      // Check if BetPlaced event was emitted
      const event = receipt.events?.find(e => e.event === "BetPlaced");
      expect(event).to.not.be.undefined;
      expect(event?.args?.id).to.equal(1);
      expect(event?.args?.bettor).to.equal(user1.address);
      expect(event?.args?.outcome).to.be.true;
      expect(event?.args?.amount).to.equal(betAmount);
      
      // Check if bet was recorded correctly
      const userBets = await predictionMarket.getUserBets(1, user1.address);
      expect(userBets.yesAmount).to.equal(betAmount);
      expect(userBets.noAmount).to.equal(0);
      
      const market = await predictionMarket.getMarket(1);
      expect(market.totalYesBets).to.equal(betAmount);
      expect(market.totalNoBets).to.equal(0);
    });

    it("Should place a No bet correctly", async function () {
      const betAmount = ethers.utils.parseEther("0.5");
      
      const tx = await predictionMarket.connect(user2).betNo(1, { value: betAmount });
      const receipt = await tx.wait();
      
      // Check if BetPlaced event was emitted
      const event = receipt.events?.find(e => e.event === "BetPlaced");
      expect(event).to.not.be.undefined;
      expect(event?.args?.id).to.equal(1);
      expect(event?.args?.bettor).to.equal(user2.address);
      expect(event?.args?.outcome).to.be.false;
      expect(event?.args?.amount).to.equal(betAmount);
      
      // Check if bet was recorded correctly
      const userBets = await predictionMarket.getUserBets(1, user2.address);
      expect(userBets.yesAmount).to.equal(0);
      expect(userBets.noAmount).to.equal(betAmount);
      
      const market = await predictionMarket.getMarket(1);
      expect(market.totalYesBets).to.equal(0);
      expect(market.totalNoBets).to.equal(betAmount);
    });

    it("Should allow multiple bets from the same user", async function () {
      const firstBet = ethers.utils.parseEther("1");
      const secondBet = ethers.utils.parseEther("0.5");
      
      await predictionMarket.connect(user1).betYes(1, { value: firstBet });
      await predictionMarket.connect(user1).betYes(1, { value: secondBet });
      
      const userBets = await predictionMarket.getUserBets(1, user1.address);
      expect(userBets.yesAmount).to.equal(firstBet.add(secondBet));
      
      const market = await predictionMarket.getMarket(1);
      expect(market.totalYesBets).to.equal(firstBet.add(secondBet));
    });

    it("Should allow both Yes and No bets from the same user", async function () {
      const yesBet = ethers.utils.parseEther("1");
      const noBet = ethers.utils.parseEther("0.5");
      
      await predictionMarket.connect(user1).betYes(1, { value: yesBet });
      await predictionMarket.connect(user1).betNo(1, { value: noBet });
      
      const userBets = await predictionMarket.getUserBets(1, user1.address);
      expect(userBets.yesAmount).to.equal(yesBet);
      expect(userBets.noAmount).to.equal(noBet);
      
      const market = await predictionMarket.getMarket(1);
      expect(market.totalYesBets).to.equal(yesBet);
      expect(market.totalNoBets).to.equal(noBet);
    });

    it("Should fail with zero bet amount", async function () {
      await expect(
        predictionMarket.connect(user1).betYes(1, { value: 0 })
      ).to.be.revertedWith("InvalidBetAmount()");
      
      await expect(
        predictionMarket.connect(user1).betNo(1, { value: 0 })
      ).to.be.revertedWith("InvalidBetAmount()");
    });

    it("Should fail if market does not exist", async function () {
      await expect(
        predictionMarket.connect(user1).betYes(999, { value: ethers.utils.parseEther("1") })
      ).to.be.revertedWith("MarketDoesNotExist(999)");
    });

    it("Should fail if market is already resolved", async function () {
      // Place some bets first
      await predictionMarket.connect(user1).betYes(1, { value: ethers.utils.parseEther("1") });
      await predictionMarket.connect(user2).betNo(1, { value: ethers.utils.parseEther("1") });
      
      // Resolve the market
      await predictionMarket.resolveMarket(1, true);
      
      // Try to bet after resolution
      await expect(
        predictionMarket.connect(user3).betYes(1, { value: ethers.utils.parseEther("1") })
      ).to.be.revertedWith("MarketAlreadyResolved(1)");
    });
  });

  describe("Market Resolution", function () {
    beforeEach(async function () {
      await predictionMarket.createMarket("Will the market go up?");
    });

    it("Should resolve market with Yes as winner", async function () {
      // Place some bets
      await predictionMarket.connect(user1).betYes(1, { value: ethers.utils.parseEther("1") });
      await predictionMarket.connect(user2).betNo(1, { value: ethers.utils.parseEther("0.5") });
      
      const tx = await predictionMarket.resolveMarket(1, true);
      const receipt = await tx.wait();
      
      // Check if MarketResolved event was emitted
      const event = receipt.events?.find(e => e.event === "MarketResolved");
      expect(event).to.not.be.undefined;
      expect(event?.args?.id).to.equal(1);
      expect(event?.args?.winningOutcome).to.be.true;
      expect(event?.args?.totalYesBets).to.equal(ethers.utils.parseEther("1"));
      expect(event?.args?.totalNoBets).to.equal(ethers.utils.parseEther("0.5"));
      
      // Check if market was resolved correctly
      const market = await predictionMarket.getMarket(1);
      expect(market.resolved).to.be.true;
      expect(market.winningOutcome).to.be.true;
    });

    it("Should resolve market with No as winner", async function () {
      // Place some bets
      await predictionMarket.connect(user1).betYes(1, { value: ethers.utils.parseEther("0.5") });
      await predictionMarket.connect(user2).betNo(1, { value: ethers.utils.parseEther("1") });
      
      await predictionMarket.resolveMarket(1, false);
      
      // Check if market was resolved correctly
      const market = await predictionMarket.getMarket(1);
      expect(market.resolved).to.be.true;
      expect(market.winningOutcome).to.be.false;
    });

    it("Should fail if non-owner tries to resolve market", async function () {
      await expect(
        predictionMarket.connect(user1).resolveMarket(1, true)
      ).to.be.revertedWith("OnlyOwner()");
    });

    it("Should fail if market does not exist", async function () {
      await expect(
        predictionMarket.resolveMarket(999, true)
      ).to.be.revertedWith("MarketDoesNotExist(999)");
    });

    it("Should fail if market is already resolved", async function () {
      await predictionMarket.resolveMarket(1, true);
      
      await expect(
        predictionMarket.resolveMarket(1, false)
      ).to.be.revertedWith("MarketAlreadyResolved(1)");
    });

    it("Should fail if there are no bets", async function () {
      await expect(
        predictionMarket.resolveMarket(1, true)
      ).to.be.revertedWith("CannotResolveWithoutBets(1)");
    });
  });

  describe("Claiming Winnings", function () {
    beforeEach(async function () {
      await predictionMarket.createMarket("Will it snow?");
      
      // Place bets
      await predictionMarket.connect(user1).betYes(1, { value: ethers.utils.parseEther("1") });
      await predictionMarket.connect(user2).betYes(1, { value: ethers.utils.parseEther("2") });
      await predictionMarket.connect(user3).betNo(1, { value: ethers.utils.parseEther("1") });
      
      // Resolve market with Yes as winner
      await predictionMarket.resolveMarket(1, true);
    });

    it("Should allow winner to claim winnings", async function () {
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      const tx = await predictionMarket.connect(user1).claim(1);
      const receipt = await tx.wait();
      
      // Check if WinningsClaimed event was emitted
      const event = receipt.events?.find(e => e.event === "WinningsClaimed");
      expect(event).to.not.be.undefined;
      expect(event?.args?.id).to.equal(1);
      expect(event?.args?.user).to.equal(user1.address);
      
      // Calculate expected payout: original stake + proportional share of losing pool
      // user1 bet 1 ETH, total Yes bets = 3 ETH, total No bets = 1 ETH
      // Expected payout = 1 + (1 * 1 / 3) = 1.333... ETH
      const expectedPayout = ethers.utils.parseEther("1").add(
        ethers.utils.parseEther("1").mul(ethers.utils.parseEther("1")).div(ethers.utils.parseEther("3"))
      );
      expect(event?.args?.payout).to.equal(expectedPayout);
      
      // Check if user has claimed
      const userBets = await predictionMarket.getUserBets(1, user1.address);
      expect(userBets.claimed).to.be.true;
      
      // Check if balance increased (accounting for gas costs)
      const finalBalance = await ethers.provider.getBalance(user1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should allow multiple winners to claim", async function () {
      await predictionMarket.connect(user1).claim(1);
      await predictionMarket.connect(user2).claim(1);
      
      const user1Bets = await predictionMarket.getUserBets(1, user1.address);
      const user2Bets = await predictionMarket.getUserBets(1, user2.address);
      
      expect(user1Bets.claimed).to.be.true;
      expect(user2Bets.claimed).to.be.true;
    });

    it("Should fail if user has no winnings", async function () {
      await expect(
        predictionMarket.connect(user3).claim(1)
      ).to.be.revertedWith("NoWinnings(1, " + user3.address + ")");
    });

    it("Should fail if user has already claimed", async function () {
      await predictionMarket.connect(user1).claim(1);
      
      await expect(
        predictionMarket.connect(user1).claim(1)
      ).to.be.revertedWith("AlreadyClaimed(1, " + user1.address + ")");
    });

    it("Should fail if market does not exist", async function () {
      await expect(
        predictionMarket.connect(user1).claim(999)
      ).to.be.revertedWith("MarketDoesNotExist(999)");
    });

    it("Should fail if market is not resolved", async function () {
      await predictionMarket.createMarket("New market");
      await predictionMarket.connect(user1).betYes(2, { value: ethers.utils.parseEther("1") });
      
      await expect(
        predictionMarket.connect(user1).claim(2)
      ).to.be.revertedWith("MarketNotResolved(2)");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle betting on resolved markets", async function () {
      await predictionMarket.createMarket("Test market");
      await predictionMarket.connect(user1).betYes(1, { value: ethers.utils.parseEther("1") });
      await predictionMarket.resolveMarket(1, true);
      
      await expect(
        predictionMarket.connect(user2).betYes(1, { value: ethers.utils.parseEther("1") })
      ).to.be.revertedWith("MarketAlreadyResolved(1)");
      
      await expect(
        predictionMarket.connect(user2).betNo(1, { value: ethers.utils.parseEther("1") })
      ).to.be.revertedWith("MarketAlreadyResolved(1)");
    });

    it("Should handle single winner scenario", async function () {
      await predictionMarket.createMarket("Single winner test");
      await predictionMarket.connect(user1).betYes(1, { value: ethers.utils.parseEther("1") });
      await predictionMarket.resolveMarket(1, true);
      
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      const tx = await predictionMarket.connect(user1).claim(1);
      const receipt = await tx.wait();
      
      const event = receipt.events?.find(e => e.event === "WinningsClaimed");
      // With single winner, they get their original bet back (no losing pool to distribute)
      expect(event?.args?.payout).to.equal(ethers.utils.parseEther("1"));
    });

    it("Should handle equal Yes and No pools", async function () {
      await predictionMarket.createMarket("Equal pools test");
      await predictionMarket.connect(user1).betYes(1, { value: ethers.utils.parseEther("1") });
      await predictionMarket.connect(user2).betNo(1, { value: ethers.utils.parseEther("1") });
      await predictionMarket.resolveMarket(1, true);
      
      const tx = await predictionMarket.connect(user1).claim(1);
      const receipt = await tx.wait();
      
      const event = receipt.events?.find(e => e.event === "WinningsClaimed");
      // Winner gets original bet + equal share of losing pool
      // Expected: 1 + (1 * 1 / 1) = 2 ETH
      expect(event?.args?.payout).to.equal(ethers.utils.parseEther("2"));
    });

    it("Should handle very small bets", async function () {
      await predictionMarket.createMarket("Small bets test");
      const smallBet = ethers.utils.parseEther("0.001");
      
      await predictionMarket.connect(user1).betYes(1, { value: smallBet });
      await predictionMarket.connect(user2).betNo(1, { value: ethers.utils.parseEther("1") });
      await predictionMarket.resolveMarket(1, true);
      
      const tx = await predictionMarket.connect(user1).claim(1);
      const receipt = await tx.wait();
      
      const event = receipt.events?.find(e => e.event === "WinningsClaimed");
      expect(event?.args?.payout).to.be.gt(smallBet);
    });

    it("Should handle multiple markets", async function () {
      await predictionMarket.createMarket("Market 1");
      await predictionMarket.createMarket("Market 2");
      
      await predictionMarket.connect(user1).betYes(1, { value: ethers.utils.parseEther("1") });
      await predictionMarket.connect(user1).betNo(2, { value: ethers.utils.parseEther("1") });
      
      await predictionMarket.resolveMarket(1, true);
      await predictionMarket.resolveMarket(2, false);
      
      await predictionMarket.connect(user1).claim(1);
      await predictionMarket.connect(user1).claim(2);
      
      const user1Bets1 = await predictionMarket.getUserBets(1, user1.address);
      const user1Bets2 = await predictionMarket.getUserBets(2, user1.address);
      
      expect(user1Bets1.claimed).to.be.true;
      expect(user1Bets2.claimed).to.be.true;
    });
  });
});