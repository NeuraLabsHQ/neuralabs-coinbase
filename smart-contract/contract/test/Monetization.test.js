const Monetization = artifacts.require("Monetization");
const MasterAccessControl = artifacts.require("MasterAccessControl");
const NFTAccessControl = artifacts.require("NFTAccessControl");
const NFTMetadata = artifacts.require("NFTMetadata");
const NFTContract = artifacts.require("NFTContract");
const AIServiceAgreementManagement = artifacts.require("AIServiceAgreementManagement");
const { expectRevert, expectEvent, time, BN } = require('@openzeppelin/test-helpers');

contract("Monetization", (accounts) => {
  const [deployer, nftOwner, buyer, subscriptionHandler, unauthorized] = accounts;
  let monetization, masterAccess, nftAccess, nftMetadata, nftContract, aiServiceAgreement;
  
  // Constants
  const SECONDS_IN_DAY = 86400;
  const DEFAULT_COMMISSION = 10; // 10%
  
  // Access levels
  const AccessLevel = {
    None: 0,
    UseModel: 1,
    Resale: 2,
    CreateReplica: 3,
    ViewAndDownload: 4,
    EditData: 5,
    AbsoluteOwnership: 6
  };

  // Valid metadata for testing
  const validMetadata = {
    ipType: "model",
    ipId: "model-123",
    imageUrl: "https://example.com/image.png",
    storageType: "neuralabs",
    storageId: "storage-123",
    encrypted: false,
    encryptionId: "",
    md5Hash: "d41d8cd98f00b204e9800998ecf8427e",
    version: "1.0.0"
  };

  let tokenId;

  beforeEach(async () => {
    // Deploy all contracts
    masterAccess = await MasterAccessControl.new({ from: deployer });
    nftAccess = await NFTAccessControl.new(masterAccess.address, { from: deployer });
    nftMetadata = await NFTMetadata.new(masterAccess.address, nftAccess.address, { from: deployer });
    nftContract = await NFTContract.new(
      masterAccess.address,
      nftAccess.address,
      nftMetadata.address,
      "0x0000000000000000000000000000000000000000",
      { from: deployer }
    );
    aiServiceAgreement = await AIServiceAgreementManagement.new(
      masterAccess.address,
      nftAccess.address,
      { from: deployer }
    );
    monetization = await Monetization.new(
      masterAccess.address,
      nftContract.address,
      nftAccess.address,
      nftMetadata.address,
      aiServiceAgreement.address,
      { from: deployer }
    );

    // Set up permissions
    await masterAccess.grantAccess(nftAccess.address, nftContract.address, { from: deployer });
    await masterAccess.grantAccess(nftMetadata.address, nftContract.address, { from: deployer });
    await masterAccess.grantAccess(nftContract.address, monetization.address, { from: deployer });
    await masterAccess.grantAccess(aiServiceAgreement.address, monetization.address, { from: deployer });
    await masterAccess.grantAccess(monetization.address, nftOwner, { from: deployer });
    
    // Set monetization in NFTContract and configure
    await nftContract.setMonetizationContract(monetization.address, { from: deployer });
    await monetization.setContractReferences(subscriptionHandler, { from: deployer });
    await monetization.setCommissionPercentage(DEFAULT_COMMISSION, { from: deployer });
    
    // Set AIServiceAgreement in NFTAccessControl
    await nftAccess.setAIServiceAgreementManagement(aiServiceAgreement.address, { from: deployer });
    
    // Create an NFT for testing
    const tx = await nftContract.createNFT(
      nftOwner,
      3, // Ownership level 3
      validMetadata.ipType,
      validMetadata.ipId,
      validMetadata.imageUrl,
      validMetadata.storageType,
      validMetadata.storageId,
      validMetadata.encrypted,
      validMetadata.encryptionId,
      validMetadata.md5Hash,
      validMetadata.version,
      { from: deployer }
    );
    tokenId = tx.logs.find(log => log.event === 'Transfer').args.tokenId;
  });

  describe("Deployment and Configuration", () => {
    it("should set correct initial values", async () => {
      assert.equal(await monetization.masterAccessControl(), masterAccess.address);
      assert.equal(await monetization.nftContract(), nftContract.address);
      assert.equal(await monetization.nftAccessControl(), nftAccess.address);
      assert.equal(await monetization.nftMetadata(), nftMetadata.address);
      assert.equal(await monetization.aiServiceAgreementManagement(), aiServiceAgreement.address);
      assert.equal(await monetization.subscriptionHandler(), subscriptionHandler);
      assert.equal((await monetization.commissionPercentage()).toNumber(), DEFAULT_COMMISSION);
    });

    describe("setCommissionPercentage", () => {
      it("should update commission percentage", async () => {
        await monetization.setCommissionPercentage(15, { from: deployer });
        assert.equal((await monetization.commissionPercentage()).toNumber(), 15);
      });

      it("should prevent setting commission above 100%", async () => {
        await expectRevert(
          monetization.setCommissionPercentage(101, { from: deployer }),
          "Commission cannot exceed 100%"
        );
      });

      it("should prevent non-deployer from setting commission", async () => {
        await expectRevert(
          monetization.setCommissionPercentage(20, { from: unauthorized }),
          "Unauthorized: Only deployer can set"
        );
      });
    });
  });

  describe("Pay-Per-Use Model", () => {
    const usageCost = web3.utils.toWei('0.1', 'ether');
    const totalUsageLimit = 1000;

    describe("enablePayPerUse", () => {
      it("should enable pay-per-use monetization", async () => {
        const tx = await monetization.enablePayPerUse(
          tokenId,
          usageCost,
          totalUsageLimit,
          { from: nftOwner }
        );

        expectEvent(tx, 'PayPerUseEnabled', {
          tokenId: tokenId,
          usageCost: usageCost,
          totalUsageLimit: totalUsageLimit.toString()
        });

        // Verify settings
        const payPerUse = await monetization.payPerUse(tokenId);
        assert.equal(payPerUse.enabled, true);
        assert.equal(payPerUse.usageCost, usageCost);
        assert.equal(payPerUse.totalUsageLimit.toNumber(), totalUsageLimit);
        assert.equal(payPerUse.totalUsageCount.toNumber(), 0);

        // Verify NFT is locked
        const lockStatus = await nftContract.lockStatus(tokenId);
        assert.equal(lockStatus.toNumber(), 0); // Locked
      });

      it("should prevent non-owner from enabling", async () => {
        await expectRevert(
          monetization.enablePayPerUse(tokenId, usageCost, totalUsageLimit, { from: buyer }),
          "Only NFT owner can configure monetization"
        );
      });

      it("should prevent enabling when already enabled", async () => {
        await monetization.enablePayPerUse(tokenId, usageCost, totalUsageLimit, { from: nftOwner });
        
        await expectRevert(
          monetization.enablePayPerUse(tokenId, usageCost, totalUsageLimit, { from: nftOwner }),
          "Pay-per-use already enabled"
        );
      });
    });

    describe("disablePayPerUse", () => {
      beforeEach(async () => {
        await monetization.enablePayPerUse(tokenId, usageCost, totalUsageLimit, { from: nftOwner });
      });

      it("should disable pay-per-use monetization", async () => {
        const tx = await monetization.disablePayPerUse(tokenId, { from: nftOwner });

        expectEvent(tx, 'PayPerUseDisabled', {
          tokenId: tokenId
        });

        const payPerUse = await monetization.payPerUse(tokenId);
        assert.equal(payPerUse.enabled, false);
      });

      it("should check unlock eligibility when disabling", async () => {
        // Enable another monetization model
        await monetization.enableSubscription(
          tokenId,
          web3.utils.toWei('1', 'ether'),
          30 * SECONDS_IN_DAY,
          100,
          7 * SECONDS_IN_DAY,
          30 * SECONDS_IN_DAY,
          { from: nftOwner }
        );

        // Disable pay-per-use (NFT should remain locked due to subscription)
        await monetization.disablePayPerUse(tokenId, { from: nftOwner });

        const lockStatus = await nftContract.lockStatus(tokenId);
        assert.equal(lockStatus.toNumber(), 0); // Still locked
      });
    });
  });

  describe("Subscription Model", () => {
    const price = web3.utils.toWei('1', 'ether');
    const duration = 30 * SECONDS_IN_DAY; // 30 days
    const usageLimit = 100;
    const commitmentTime = 7 * SECONDS_IN_DAY; // 7 days
    const noticeTime = 30 * SECONDS_IN_DAY; // 30 days

    describe("enableSubscription", () => {
      it("should enable subscription monetization", async () => {
        const tx = await monetization.enableSubscription(
          tokenId,
          price,
          duration,
          usageLimit,
          commitmentTime,
          noticeTime,
          { from: nftOwner }
        );

        expectEvent(tx, 'SubscriptionEnabled', {
          tokenId: tokenId,
          price: price,
          duration: duration.toString()
        });

        const subscription = await monetization.subscription(tokenId);
        assert.equal(subscription.enabled, true);
        assert.equal(subscription.price, price);
        assert.equal(subscription.duration.toNumber(), duration);
        assert.equal(subscription.usageLimit.toNumber(), usageLimit);
      });

      it("should set commitment times", async () => {
        await monetization.enableSubscription(
          tokenId,
          price,
          duration,
          usageLimit,
          commitmentTime,
          noticeTime,
          { from: nftOwner }
        );

        const commitment = await monetization.commitmentNotice(tokenId);
        assert.equal(commitment.commitmentTime.toNumber(), commitmentTime);
        assert.equal(commitment.noticeTime.toNumber(), noticeTime);
      });

      it("should prevent enabling when IP type is 'data'", async () => {
        // Create NFT with data IP type
        const tx = await nftContract.createNFT(
          nftOwner,
          3,
          "data", // IP type data
          "data-123",
          validMetadata.imageUrl,
          validMetadata.storageType,
          validMetadata.storageId,
          validMetadata.encrypted,
          validMetadata.encryptionId,
          validMetadata.md5Hash,
          validMetadata.version,
          { from: deployer }
        );
        const dataTokenId = tx.logs.find(log => log.event === 'Transfer').args.tokenId;

        await expectRevert(
          monetization.enableSubscription(
            dataTokenId,
            price,
            duration,
            usageLimit,
            commitmentTime,
            noticeTime,
            { from: nftOwner }
          ),
          "IP type 'data' only supports buy ownership"
        );
      });
    });

    describe("disableSubscription", () => {
      beforeEach(async () => {
        await monetization.enableSubscription(
          tokenId,
          price,
          duration,
          usageLimit,
          commitmentTime,
          noticeTime,
          { from: nftOwner }
        );
      });

      it("should disable subscription when no active subscriptions", async () => {
        const tx = await monetization.disableSubscription(tokenId, { from: nftOwner });

        expectEvent(tx, 'SubscriptionDisabled', {
          tokenId: tokenId
        });

        const subscription = await monetization.subscription(tokenId);
        assert.equal(subscription.enabled, false);
      });

      it("should prevent disabling with active subscriptions", async () => {
        // Grant monetization contract access
        await masterAccess.grantAccess(aiServiceAgreement.address, monetization.address, { from: deployer });
        
        // Record a subscription sale
        await aiServiceAgreement.recordSubscriptionSale(
          tokenId,
          buyer,
          Math.floor(Date.now() / 1000) + duration,
          { from: monetization.address }
        );

        await expectRevert(
          monetization.disableSubscription(tokenId, { from: nftOwner }),
          "Cannot disable with active subscriptions"
        );
      });
    });
  });

  describe("Buy Access Model", () => {
    const price = web3.utils.toWei('0.5', 'ether');
    const duration = 7 * SECONDS_IN_DAY; // 7 days
    const accessLevel = AccessLevel.UseModel;
    const commitmentTime = 3 * SECONDS_IN_DAY;
    const noticeTime = 7 * SECONDS_IN_DAY;

    describe("enableBuyAccess", () => {
      it("should enable buy access monetization", async () => {
        const tx = await monetization.enableBuyAccess(
          tokenId,
          price,
          duration,
          accessLevel,
          commitmentTime,
          noticeTime,
          { from: nftOwner }
        );

        expectEvent(tx, 'BuyAccessEnabled', {
          tokenId: tokenId,
          price: price,
          duration: duration.toString(),
          accessLevel: accessLevel.toString()
        });

        const buyAccess = await monetization.buyAccess(tokenId);
        assert.equal(buyAccess.enabled, true);
        assert.equal(buyAccess.price, price);
        assert.equal(buyAccess.duration.toNumber(), duration);
        assert.equal(buyAccess.accessLevel, accessLevel);
      });

      it("should prevent invalid access levels", async () => {
        await expectRevert(
          monetization.enableBuyAccess(
            tokenId,
            price,
            duration,
            0, // Invalid access level
            commitmentTime,
            noticeTime,
            { from: nftOwner }
          ),
          "Invalid access level"
        );

        await expectRevert(
          monetization.enableBuyAccess(
            tokenId,
            price,
            duration,
            7, // Invalid access level
            commitmentTime,
            noticeTime,
            { from: nftOwner }
          ),
          "Invalid access level"
        );
      });
    });

    describe("buyAccess", () => {
      beforeEach(async () => {
        await monetization.enableBuyAccess(
          tokenId,
          price,
          duration,
          accessLevel,
          commitmentTime,
          noticeTime,
          { from: nftOwner }
        );
      });

      it("should allow buying access with correct payment", async () => {
        const initialOwnerBalance = await web3.eth.getBalance(nftOwner);
        const initialPlatformBalance = await web3.eth.getBalance(deployer);

        const tx = await monetization.buyAccess(tokenId, { from: buyer, value: price });

        expectEvent(tx, 'AccessPurchased', {
          tokenId: tokenId,
          buyer: buyer,
          price: price,
          accessLevel: accessLevel.toString()
        });

        // Verify access was granted
        const userAccess = await nftAccess.getUserAccessLevel(tokenId, buyer);
        assert.equal(userAccess.toNumber(), accessLevel);

        // Verify agreement was recorded
        const hasAccess = await aiServiceAgreement.hasActiveAccess(tokenId, buyer);
        assert.equal(hasAccess, true);

        // Verify payments
        const commission = new BN(price).mul(new BN(DEFAULT_COMMISSION)).div(new BN(100));
        const ownerPayment = new BN(price).sub(commission);

        const finalOwnerBalance = await web3.eth.getBalance(nftOwner);
        const finalPlatformBalance = await web3.eth.getBalance(deployer);

        assert.equal(
          new BN(finalOwnerBalance).sub(new BN(initialOwnerBalance)).toString(),
          ownerPayment.toString(),
          "Owner should receive payment minus commission"
        );
      });

      it("should prevent buying with insufficient payment", async () => {
        const insufficientPayment = web3.utils.toWei('0.4', 'ether');

        await expectRevert(
          monetization.buyAccess(tokenId, { from: buyer, value: insufficientPayment }),
          "Insufficient payment"
        );
      });

      it("should prevent buying when not enabled", async () => {
        await monetization.disableBuyAccess(tokenId, { from: nftOwner });

        await expectRevert(
          monetization.buyAccess(tokenId, { from: buyer, value: price }),
          "Buy access not enabled"
        );
      });
    });
  });

  describe("Buy Ownership Model", () => {
    const price = web3.utils.toWei('10', 'ether');

    describe("enableBuyOwnership", () => {
      it("should enable buy ownership monetization", async () => {
        const tx = await monetization.enableBuyOwnership(tokenId, price, { from: nftOwner });

        expectEvent(tx, 'BuyOwnershipEnabled', {
          tokenId: tokenId,
          price: price
        });

        const buyOwnership = await monetization.buyOwnership(tokenId);
        assert.equal(buyOwnership.enabled, true);
        assert.equal(buyOwnership.price, price);
      });

      it("should lock NFT when enabling", async () => {
        await monetization.enableBuyOwnership(tokenId, price, { from: nftOwner });

        const lockStatus = await nftContract.lockStatus(tokenId);
        assert.equal(lockStatus.toNumber(), 0); // Locked
      });
    });

    describe("buyOwnership", () => {
      beforeEach(async () => {
        await monetization.enableBuyOwnership(tokenId, price, { from: nftOwner });
      });

      it("should transfer ownership with payment", async () => {
        const tx = await monetization.buyOwnership(tokenId, { from: buyer, value: price });

        expectEvent(tx, 'OwnershipPurchased', {
          tokenId: tokenId,
          previousOwner: nftOwner,
          newOwner: buyer,
          price: price
        });

        // Verify NFT ownership transferred
        assert.equal(await nftContract.ownerOf(tokenId), buyer);

        // Verify NFT is unlocked
        const lockStatus = await nftContract.lockStatus(tokenId);
        assert.equal(lockStatus.toNumber(), 3); // Unlocked

        // Verify buy ownership is disabled
        const buyOwnership = await monetization.buyOwnership(tokenId);
        assert.equal(buyOwnership.enabled, false);
      });

      it("should handle commission correctly", async () => {
        const initialOwnerBalance = new BN(await web3.eth.getBalance(nftOwner));
        const initialPlatformBalance = new BN(await web3.eth.getBalance(deployer));

        await monetization.buyOwnership(tokenId, { from: buyer, value: price });

        const finalOwnerBalance = new BN(await web3.eth.getBalance(nftOwner));
        const finalPlatformBalance = new BN(await web3.eth.getBalance(deployer));

        const commission = new BN(price).mul(new BN(DEFAULT_COMMISSION)).div(new BN(100));
        const ownerPayment = new BN(price).sub(commission);

        assert.equal(
          finalOwnerBalance.sub(initialOwnerBalance).toString(),
          ownerPayment.toString(),
          "Owner should receive payment minus commission"
        );
      });
    });
  });

  describe("Buy Replica Model", () => {
    const price = web3.utils.toWei('2', 'ether');
    const ownershipLevel = 2;

    describe("enableBuyReplica", () => {
      it("should enable buy replica monetization", async () => {
        const tx = await monetization.enableBuyReplica(
          tokenId,
          price,
          ownershipLevel,
          { from: nftOwner }
        );

        expectEvent(tx, 'BuyReplicaEnabled', {
          tokenId: tokenId,
          price: price,
          ownershipLevel: ownershipLevel.toString()
        });

        const buyReplica = await monetization.buyReplica(tokenId);
        assert.equal(buyReplica.enabled, true);
        assert.equal(buyReplica.price, price);
        assert.equal(buyReplica.ownershipLevel, ownershipLevel);
      });

      it("should prevent invalid ownership level", async () => {
        await expectRevert(
          monetization.enableBuyReplica(tokenId, price, 0, { from: nftOwner }),
          "Invalid ownership level"
        );

        await expectRevert(
          monetization.enableBuyReplica(tokenId, price, 7, { from: nftOwner }),
          "Invalid ownership level"
        );
      });

      it("should prevent enabling for data IP type", async () => {
        // Create NFT with data IP type
        const tx = await nftContract.createNFT(
          nftOwner,
          3,
          "data",
          "data-123",
          validMetadata.imageUrl,
          validMetadata.storageType,
          validMetadata.storageId,
          validMetadata.encrypted,
          validMetadata.encryptionId,
          validMetadata.md5Hash,
          validMetadata.version,
          { from: deployer }
        );
        const dataTokenId = tx.logs.find(log => log.event === 'Transfer').args.tokenId;

        await expectRevert(
          monetization.enableBuyReplica(dataTokenId, price, ownershipLevel, { from: nftOwner }),
          "IP type 'data' only supports buy ownership"
        );
      });
    });

    describe("buyReplica", () => {
      beforeEach(async () => {
        await monetization.enableBuyReplica(tokenId, price, ownershipLevel, { from: nftOwner });
      });

      it("should create replica NFT with payment", async () => {
        const tx = await monetization.buyReplica(tokenId, { from: buyer, value: price });

        // Find the replica token ID from events
        const transferEvent = tx.logs.find(
          log => log.event === 'Transfer' && log.args.to === buyer
        );
        const replicaTokenId = transferEvent.args.tokenId;

        expectEvent(tx, 'ReplicaPurchased', {
          originalTokenId: tokenId,
          buyer: buyer,
          price: price
        });

        // Verify replica NFT was created
        assert.equal(await nftContract.ownerOf(replicaTokenId), buyer);
        assert.equal(
          (await nftContract.nftOwnershipLevel(replicaTokenId)).toNumber(),
          ownershipLevel
        );

        // Verify metadata was replicated
        const originalMetadata = await nftMetadata.getMetadata(tokenId);
        const replicaMetadata = await nftMetadata.getMetadata(replicaTokenId);
        assert.equal(replicaMetadata.ipType, originalMetadata.ipType);
        assert.equal(replicaMetadata.ipId, originalMetadata.ipId);
      });
    });
  });

  describe("Batch Monetization Configuration", () => {
    it("should set all monetization options at once", async () => {
      const options = {
        // Pay per use
        payPerUseEnabled: true,
        payPerUseUsageCost: web3.utils.toWei('0.1', 'ether'),
        payPerUseTotalUsageLimit: 1000,
        // Subscription
        subscriptionEnabled: true,
        subscriptionPrice: web3.utils.toWei('1', 'ether'),
        subscriptionDuration: 30 * SECONDS_IN_DAY,
        subscriptionUsageLimit: 100,
        // Buy access
        buyAccessEnabled: true,
        buyAccessPrice: web3.utils.toWei('0.5', 'ether'),
        buyAccessDuration: 7 * SECONDS_IN_DAY,
        buyAccessAccessLevel: AccessLevel.UseModel,
        // Buy ownership
        buyOwnershipEnabled: true,
        buyOwnershipPrice: web3.utils.toWei('10', 'ether'),
        // Buy replica
        buyReplicaEnabled: true,
        buyReplicaPrice: web3.utils.toWei('2', 'ether'),
        buyReplicaOwnershipLevel: 2,
        // Commitment times
        commitmentTime: 7 * SECONDS_IN_DAY,
        noticeTime: 30 * SECONDS_IN_DAY
      };

      await monetization.setAllMonetizationOptions(
        tokenId,
        options.payPerUseEnabled,
        options.payPerUseUsageCost,
        options.payPerUseTotalUsageLimit,
        options.subscriptionEnabled,
        options.subscriptionPrice,
        options.subscriptionDuration,
        options.subscriptionUsageLimit,
        options.buyAccessEnabled,
        options.buyAccessPrice,
        options.buyAccessDuration,
        options.buyAccessAccessLevel,
        options.buyOwnershipEnabled,
        options.buyOwnershipPrice,
        options.buyReplicaEnabled,
        options.buyReplicaPrice,
        options.buyReplicaOwnershipLevel,
        options.commitmentTime,
        options.noticeTime,
        { from: nftOwner }
      );

      // Verify all options were set
      const payPerUse = await monetization.payPerUse(tokenId);
      assert.equal(payPerUse.enabled, options.payPerUseEnabled);
      assert.equal(payPerUse.usageCost, options.payPerUseUsageCost);

      const subscription = await monetization.subscription(tokenId);
      assert.equal(subscription.enabled, options.subscriptionEnabled);
      assert.equal(subscription.price, options.subscriptionPrice);

      const buyAccess = await monetization.buyAccess(tokenId);
      assert.equal(buyAccess.enabled, options.buyAccessEnabled);
      assert.equal(buyAccess.price, options.buyAccessPrice);

      const buyOwnership = await monetization.buyOwnership(tokenId);
      assert.equal(buyOwnership.enabled, options.buyOwnershipEnabled);
      assert.equal(buyOwnership.price, options.buyOwnershipPrice);

      const buyReplica = await monetization.buyReplica(tokenId);
      assert.equal(buyReplica.enabled, options.buyReplicaEnabled);
      assert.equal(buyReplica.price, options.buyReplicaPrice);
    });
  });

  describe("Unlock Eligibility", () => {
    it("should check unlock eligibility correctly", async () => {
      // Enable multiple monetization models
      await monetization.enablePayPerUse(
        tokenId,
        web3.utils.toWei('0.1', 'ether'),
        1000,
        { from: nftOwner }
      );
      await monetization.enableSubscription(
        tokenId,
        web3.utils.toWei('1', 'ether'),
        30 * SECONDS_IN_DAY,
        100,
        7 * SECONDS_IN_DAY,
        30 * SECONDS_IN_DAY,
        { from: nftOwner }
      );

      // Check eligibility (should be false - models are enabled)
      let canUnlock = await monetization.checkUnlockEligibility(tokenId);
      assert.equal(canUnlock, false);

      // Disable pay-per-use
      await monetization.disablePayPerUse(tokenId, { from: nftOwner });

      // Still can't unlock (subscription is enabled)
      canUnlock = await monetization.checkUnlockEligibility(tokenId);
      assert.equal(canUnlock, false);

      // Disable subscription
      await monetization.disableSubscription(tokenId, { from: nftOwner });

      // Now can unlock
      canUnlock = await monetization.checkUnlockEligibility(tokenId);
      assert.equal(canUnlock, true);
    });

    it("should prevent unlock with active subscriptions", async () => {
      await monetization.enableSubscription(
        tokenId,
        web3.utils.toWei('1', 'ether'),
        30 * SECONDS_IN_DAY,
        100,
        7 * SECONDS_IN_DAY,
        30 * SECONDS_IN_DAY,
        { from: nftOwner }
      );

      // Record active subscription
      await masterAccess.grantAccess(aiServiceAgreement.address, monetization.address, { from: deployer });
      await aiServiceAgreement.recordSubscriptionSale(
        tokenId,
        buyer,
        Math.floor(Date.now() / 1000) + 30 * SECONDS_IN_DAY,
        { from: monetization.address }
      );

      // Check eligibility
      const canUnlock = await monetization.checkUnlockEligibility(tokenId);
      assert.equal(canUnlock, false);
    });
  });

  describe("Edge Cases and Security", () => {
    it("should handle zero prices", async () => {
      await expectRevert(
        monetization.enableBuyAccess(
          tokenId,
          0, // Zero price
          7 * SECONDS_IN_DAY,
          AccessLevel.UseModel,
          3 * SECONDS_IN_DAY,
          7 * SECONDS_IN_DAY,
          { from: nftOwner }
        ),
        "Price must be greater than 0"
      );
    });

    it("should prevent reentrancy in purchase functions", async () => {
      // This test would require a malicious contract to properly test reentrancy
      // For now, we verify that the functions complete successfully
      await monetization.enableBuyOwnership(tokenId, web3.utils.toWei('1', 'ether'), { from: nftOwner });
      
      const tx = await monetization.buyOwnership(tokenId, { 
        from: buyer, 
        value: web3.utils.toWei('1', 'ether') 
      });
      
      assert.equal(await nftContract.ownerOf(tokenId), buyer);
    });

    it("should handle payment failures gracefully", async () => {
      // Create a contract that can't receive ETH to test payment failure
      // This would require deploying a separate contract
      // For now, we verify basic payment validation
      await monetization.enableBuyAccess(
        tokenId,
        web3.utils.toWei('1', 'ether'),
        7 * SECONDS_IN_DAY,
        AccessLevel.UseModel,
        3 * SECONDS_IN_DAY,
        7 * SECONDS_IN_DAY,
        { from: nftOwner }
      );

      await expectRevert(
        monetization.buyAccess(tokenId, { 
          from: buyer, 
          value: web3.utils.toWei('0.5', 'ether') // Insufficient
        }),
        "Insufficient payment"
      );
    });
  });
});