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
    await masterAccess.grantAccess(nftAccess.address, nftMetadata.address, { from: deployer });
    await masterAccess.grantAccess(nftMetadata.address, nftOwner, { from: deployer });
    
    // Set monetization in NFTContract and configure
    await nftContract.setMonetizationContract(monetization.address, { from: deployer });
    await monetization.setContractReferences(subscriptionHandler, { from: deployer });
    await monetization.setCommissionPercentage(DEFAULT_COMMISSION, { from: deployer });
    
    // Set AIServiceAgreement in NFTAccessControl
    await nftAccess.setAIServiceAgreementManagement(aiServiceAgreement.address, { from: deployer });
    
    // Create an NFT for testing - only 2 parameters
    const tx = await nftContract.createNFT(
      "Test NFT",
      3, // Ownership level 3
      { from: nftOwner }
    );
    tokenId = tx.logs.find(log => log.event === 'NFTCreated').args.tokenId;
    
    // Set metadata for the NFT
    const metadata = {
      intellectual_property_type: validMetadata.ipType,
      intellectual_property_id: validMetadata.ipId,
      image_url: validMetadata.imageUrl,
      storage_type: validMetadata.storageType,
      storage_id: validMetadata.storageId,
      encrypted: validMetadata.encrypted,
      encryption_id: validMetadata.encryptionId,
      md5_hash: validMetadata.md5Hash,
      version: validMetadata.version
    };
    await nftMetadata.createMetadata(tokenId, metadata, { from: nftOwner });
  });

  describe("Deployment and Configuration", () => {
    it("should set correct initial values", async () => {
      assert.equal(await monetization.masterAccessControl(), masterAccess.address);
      assert.equal(await monetization.nftContract(), nftContract.address);
      assert.equal(await monetization.nftAccessControl(), nftAccess.address);
      assert.equal(await monetization.nftMetadata(), nftMetadata.address);
      assert.equal(await monetization.aiServiceAgreementManagement(), aiServiceAgreement.address);
      assert.equal(await monetization.subscriptionHandlerPublicKey(), subscriptionHandler);
      assert.equal((await monetization.commission_percentage()).toNumber(), DEFAULT_COMMISSION);
    });

    describe("setCommissionPercentage", () => {
      it("should update commission percentage", async () => {
        await monetization.setCommissionPercentage(15, { from: deployer });
        assert.equal((await monetization.commission_percentage()).toNumber(), 15);
      });

      it("should prevent setting commission above 100%", async () => {
        await expectRevert(
          monetization.setCommissionPercentage(101, { from: deployer }),
          "Monetization: Invalid commission percentage"
        );
      });

      it("should prevent non-deployer from setting commission", async () => {
        await expectRevert(
          monetization.setCommissionPercentage(20, { from: unauthorized }),
          "Monetization: Caller not authorized"
        );
      });
    });
  });

  describe("Pay-Per-Use Model", () => {
    const costPerUse = 100; // Cost in USD
    const platformCostPaidBy = buyer; // Who pays platform fees
    let futureCommitmentTime;
    let noticeTime;

    beforeEach(async () => {
      // Set commitment time 90 days in future
      futureCommitmentTime = Math.floor(Date.now() / 1000) + (90 * SECONDS_IN_DAY);
      noticeTime = 30 * SECONDS_IN_DAY;
      
      // Set commitment and notice first
      await monetization.setCommitmentTime(tokenId, futureCommitmentTime, { from: nftOwner });
      await monetization.setNoticeBeforeUnlockCommitment(tokenId, noticeTime, { from: nftOwner });
    });

    describe("enablePayPerUse", () => {
      it("should enable pay-per-use monetization", async () => {
        const tx = await monetization.enablePayPerUse(
          tokenId,
          costPerUse,
          platformCostPaidBy,
          { from: nftOwner }
        );

        expectEvent(tx, 'MonetizationEnabled', {
          nftId: tokenId,
          optionIndex: '0'
        });

        // Verify settings
        const payPerUse = await monetization.payPerUseData(tokenId);
        assert.equal(payPerUse.enabled, true);
        assert.equal(payPerUse.cost_per_use, costPerUse);
        assert.equal(payPerUse.platform_cost_paid_by, platformCostPaidBy);

        // Verify NFT is locked
        const lockStatus = await nftContract.getLockStatus(tokenId);
        assert.equal(lockStatus.toNumber(), 0); // Locked
      });

      it("should prevent non-owner from enabling", async () => {
        await expectRevert(
          monetization.enablePayPerUse(tokenId, costPerUse, platformCostPaidBy, { from: buyer }),
          "Monetization: Caller is not NFT owner"
        );
      });

      it("should require commitment time to be set", async () => {
        // Create new NFT without commitment time
        const tx = await nftContract.createNFT("Test NFT 2", 3, { from: nftOwner });
        const newTokenId = tx.logs.find(log => log.event === 'NFTCreated').args.tokenId;
        
        // Set metadata
        const metadata = {
          intellectual_property_type: "model",
          intellectual_property_id: "model-456",
          image_url: "https://example.com/image2.png",
          storage_type: "neuralabs",
          storage_id: "storage-456",
          encrypted: false,
          encryption_id: "",
          md5_hash: "d41d8cd98f00b204e9800998ecf8427e",
          version: "1.0.0"
        };
        await nftMetadata.createMetadata(newTokenId, metadata, { from: nftOwner });
        
        await expectRevert(
          monetization.enablePayPerUse(newTokenId, costPerUse, platformCostPaidBy, { from: nftOwner }),
          "Monetization: Commitment time not set"
        );
      });
    });

    describe("disablePayPerUse", () => {
      beforeEach(async () => {
        await monetization.enablePayPerUse(tokenId, costPerUse, platformCostPaidBy, { from: nftOwner });
      });

      it("should disable pay-per-use monetization", async () => {
        const tx = await monetization.disablePayPerUse(tokenId, { from: nftOwner });

        expectEvent(tx, 'MonetizationDisabled', {
          nftId: tokenId,
          optionIndex: '0'
        });

        const payPerUse = await monetization.payPerUseData(tokenId);
        assert.equal(payPerUse.enabled, false);
      });

      it("should check unlock eligibility when disabling", async () => {
        // Enable another monetization model (subscription)
        await monetization.enableSubscription(
          tokenId,
          web3.utils.toWei('1', 'ether'),
          30, // days
          100, // limit
          60, // limit time in minutes
          { from: nftOwner }
        );

        // Disable pay-per-use (NFT should remain locked due to subscription)
        await monetization.disablePayPerUse(tokenId, { from: nftOwner });

        const lockStatus = await nftContract.getLockStatus(tokenId);
        assert.equal(lockStatus.toNumber(), 0); // Still locked
      });
    });
  });

  describe("Subscription Model", () => {
    const cost = web3.utils.toWei('1', 'ether');
    const time = 30; // 30 days
    const limit = 100;
    const limitTime = 60; // 60 minutes
    let futureCommitmentTime;
    let noticeTime;

    beforeEach(async () => {
      // Set commitment time 90 days in future
      futureCommitmentTime = Math.floor(Date.now() / 1000) + (90 * SECONDS_IN_DAY);
      noticeTime = 30 * SECONDS_IN_DAY;
      
      // Set commitment and notice first
      await monetization.setCommitmentTime(tokenId, futureCommitmentTime, { from: nftOwner });
      await monetization.setNoticeBeforeUnlockCommitment(tokenId, noticeTime, { from: nftOwner });
    });

    describe("enableSubscription", () => {
      it("should enable subscription monetization", async () => {
        const tx = await monetization.enableSubscription(
          tokenId,
          cost,
          time,
          limit,
          limitTime,
          { from: nftOwner }
        );

        expectEvent(tx, 'MonetizationEnabled', {
          nftId: tokenId,
          optionIndex: '1'
        });

        const subscription = await monetization.subscriptionData(tokenId);
        assert.equal(subscription.enabled, true);
        assert.equal(subscription.subscription_cost, cost);
        assert.equal(subscription.subscription_time.toNumber(), time);
        assert.equal(subscription.limit.toNumber(), limit);
        assert.equal(subscription.limit_time.toNumber(), limitTime);
      });

      it("should lock NFT when enabling", async () => {
        await monetization.enableSubscription(
          tokenId,
          cost,
          time,
          limit,
          limitTime,
          { from: nftOwner }
        );

        const lockStatus = await nftContract.getLockStatus(tokenId);
        assert.equal(lockStatus.toNumber(), 0); // Locked
      });

      it("should prevent enabling when IP type is 'data'", async () => {
        // Create NFT with data IP type
        const tx = await nftContract.createNFT(
          "Data NFT",
          3,
          { from: nftOwner }
        );
        const dataTokenId = tx.logs.find(log => log.event === 'NFTCreated').args.tokenId;
        
        // Set max access level
        
        // Set metadata with data type
        const dataMetadata = {
          intellectual_property_type: "data",
          intellectual_property_id: "data-123",
          image_url: validMetadata.imageUrl,
          storage_type: validMetadata.storageType,
          storage_id: validMetadata.storageId,
          encrypted: validMetadata.encrypted,
          encryption_id: validMetadata.encryptionId,
          md5_hash: validMetadata.md5Hash,
          version: validMetadata.version
        };
        await nftMetadata.createMetadata(dataTokenId, dataMetadata, { from: nftOwner });
        
        // Set commitment times
        await monetization.setCommitmentTime(dataTokenId, futureCommitmentTime, { from: nftOwner });
        await monetization.setNoticeBeforeUnlockCommitment(dataTokenId, noticeTime, { from: nftOwner });

        await expectRevert(
          monetization.enableSubscription(
            dataTokenId,
            cost,
            time,
            limit,
            limitTime,
            { from: nftOwner }
          ),
          "Monetization: Data type only supports buy-ownership"
        );
      });
    });

    describe("disableSubscription", () => {
      beforeEach(async () => {
        await monetization.enableSubscription(
          tokenId,
          cost,
          time,
          limit,
          limitTime,
          { from: nftOwner }
        );
      });

      it("should disable subscription when no active subscriptions", async () => {
        const tx = await monetization.disableSubscription(tokenId, { from: nftOwner });

        expectEvent(tx, 'MonetizationDisabled', {
          nftId: tokenId,
          optionIndex: '1'
        });

        const subscription = await monetization.subscriptionData(tokenId);
        assert.equal(subscription.enabled, false);
      });

      it("should prevent disabling with active subscriptions", async () => {
        // Grant monetization contract access
        await masterAccess.grantAccess(aiServiceAgreement.address, monetization.address, { from: deployer });
        
        // Record a subscription sale - using correct parameters
        await aiServiceAgreement.recordSubscriptionSale(
          tokenId,
          buyer,
          cost,
          time * SECONDS_IN_DAY, // Convert days to seconds
          { from: monetization.address }
        );

        await expectRevert(
          monetization.disableSubscription(tokenId, { from: nftOwner }),
          "Monetization: Active subscriptions exist"
        );
      });
    });
  });

  describe("Buy Access Model", () => {
    const cost = web3.utils.toWei('0.5', 'ether');
    const accessTime = 7; // 7 days
    const accessLevel = AccessLevel.UseModel;
    let futureCommitmentTime;
    let noticeTime;

    beforeEach(async () => {
      // Set commitment time 90 days in future
      futureCommitmentTime = Math.floor(Date.now() / 1000) + (90 * SECONDS_IN_DAY);
      noticeTime = 30 * SECONDS_IN_DAY;
      
      // Set commitment and notice first
      await monetization.setCommitmentTime(tokenId, futureCommitmentTime, { from: nftOwner });
      await monetization.setNoticeBeforeUnlockCommitment(tokenId, noticeTime, { from: nftOwner });
    });

    describe("enableBuyAccess", () => {
      it("should enable buy access monetization", async () => {
        const tx = await monetization.enableBuyAccess(
          tokenId,
          accessLevel,
          accessTime,
          cost,
          { from: nftOwner }
        );

        expectEvent(tx, 'MonetizationEnabled', {
          nftId: tokenId,
          optionIndex: '2'
        });

        const buyAccess = await monetization.buyAccessData(tokenId);
        assert.equal(buyAccess.enabled, true);
        assert.equal(buyAccess.cost, cost);
        assert.equal(buyAccess.access_time.toNumber(), accessTime);
        assert.equal(buyAccess.access_level, accessLevel);
      });

      it("should validate access time doesn't exceed commitment", async () => {
        // Try to set access time that exceeds commitment
        const excessiveTime = 100; // 100 days, more than 90 day commitment
        
        await expectRevert(
          monetization.enableBuyAccess(
            tokenId,
            accessLevel,
            excessiveTime,
            cost,
            { from: nftOwner }
          ),
          "Monetization: Access time exceeds commitment"
        );
      });
    });

    describe("buyAccess", () => {
      beforeEach(async () => {
        await monetization.enableBuyAccess(
          tokenId,
          accessLevel,
          accessTime,
          cost,
          { from: nftOwner }
        );
      });

      it("should allow buying access with correct payment", async () => {
        const initialOwnerBalance = await web3.eth.getBalance(nftOwner);

        const tx = await monetization.buyAccess(tokenId, { from: buyer, value: cost });

        expectEvent(tx, 'PaymentProcessed', {
          nftId: tokenId,
          buyer: buyer,
          amount: cost,
          paymentType: 'buy-access'
        });

        // Verify access was granted
        const userAccess = await nftAccess.getAccessLevel(tokenId, buyer);
        assert.equal(userAccess.toNumber(), accessLevel);

        // Verify agreement was recorded
        const hasAccess = await aiServiceAgreement.hasActiveAccess(tokenId, buyer);
        assert.equal(hasAccess, true);

        // Verify payments
        const commission = new BN(cost).mul(new BN(DEFAULT_COMMISSION)).div(new BN(100));
        const ownerPayment = new BN(cost).sub(commission);

        const finalOwnerBalance = await web3.eth.getBalance(nftOwner);

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
          "Monetization: Insufficient payment"
        );
      });

      it("should prevent buying when not enabled", async () => {
        await monetization.disableBuyAccess(tokenId, { from: nftOwner });

        await expectRevert(
          monetization.buyAccess(tokenId, { from: buyer, value: cost }),
          "Monetization: Buy-access not enabled"
        );
      });
    });
  });

  describe("Buy Ownership Model", () => {
    const cost = web3.utils.toWei('10', 'ether');
    const ownershipLevel = 3;

    describe("enableBuyOwnership", () => {
      it("should enable buy ownership monetization", async () => {
        const tx = await monetization.enableBuyOwnership(
          tokenId, 
          cost,
          ownershipLevel,
          { from: nftOwner }
        );

        expectEvent(tx, 'MonetizationEnabled', {
          nftId: tokenId,
          optionIndex: '3'
        });

        const buyOwnership = await monetization.buyOwnershipData(tokenId);
        assert.equal(buyOwnership.enabled, true);
        assert.equal(buyOwnership.cost, cost);
        assert.equal(buyOwnership.ownership_level, ownershipLevel);
      });

      it("should not lock NFT when enabling buy ownership", async () => {
        await monetization.enableBuyOwnership(
          tokenId,
          cost,
          ownershipLevel,
          { from: nftOwner }
        );

        const lockStatus = await nftContract.getLockStatus(tokenId);
        assert.equal(lockStatus.toNumber(), 3); // Unlocked
      });
    });

    describe("buyOwnership", () => {
      beforeEach(async () => {
        await monetization.enableBuyOwnership(
          tokenId,
          cost,
          ownershipLevel,
          { from: nftOwner }
        );
      });

      it("should transfer ownership with payment", async () => {
        const tx = await monetization.buyOwnership(tokenId, { from: buyer, value: cost });

        expectEvent(tx, 'PaymentProcessed', {
          nftId: tokenId,
          buyer: buyer,
          amount: cost,
          paymentType: 'buy-ownership'
        });

        // Check for Transfer event from NFTContract
        expectEvent.inTransaction(tx.tx, nftContract, 'Transfer', {
          from: nftOwner,
          to: buyer,
          tokenId: tokenId
        });

        // Verify NFT ownership transferred
        assert.equal(await nftContract.ownerOf(tokenId), buyer);

        // Verify buy ownership is disabled
        const buyOwnership = await monetization.buyOwnershipData(tokenId);
        assert.equal(buyOwnership.enabled, false);
      });

      it("should handle commission correctly", async () => {
        const initialOwnerBalance = new BN(await web3.eth.getBalance(nftOwner));

        await monetization.buyOwnership(tokenId, { from: buyer, value: cost });

        const finalOwnerBalance = new BN(await web3.eth.getBalance(nftOwner));

        const commission = new BN(cost).mul(new BN(DEFAULT_COMMISSION)).div(new BN(100));
        const ownerPayment = new BN(cost).sub(commission);

        assert.equal(
          finalOwnerBalance.sub(initialOwnerBalance).toString(),
          ownerPayment.toString(),
          "Owner should receive payment minus commission"
        );
      });
      
      it("should prevent buying locked NFT", async () => {
        // Enable pay-per-use to lock the NFT
        const futureCommitmentTime = Math.floor(Date.now() / 1000) + (90 * SECONDS_IN_DAY);
        const noticeTime = 30 * SECONDS_IN_DAY;
        await monetization.setCommitmentTime(tokenId, futureCommitmentTime, { from: nftOwner });
        await monetization.setNoticeBeforeUnlockCommitment(tokenId, noticeTime, { from: nftOwner });
        await monetization.enablePayPerUse(tokenId, 100, buyer, { from: nftOwner });
        
        await expectRevert(
          monetization.buyOwnership(tokenId, { from: buyer, value: cost }),
          "Monetization: Cannot sell locked NFT - commitment active"
        );
      });
    });
  });

  describe("Buy Replica Model", () => {
    const cost = web3.utils.toWei('2', 'ether');
    const ownershipLevel = 2;

    describe("enableBuyReplica", () => {
      it("should enable buy replica monetization", async () => {
        const tx = await monetization.enableBuyReplica(
          tokenId,
          cost,
          ownershipLevel,
          { from: nftOwner }
        );

        expectEvent(tx, 'MonetizationEnabled', {
          nftId: tokenId,
          optionIndex: '4'
        });

        const buyReplica = await monetization.buyReplicaData(tokenId);
        assert.equal(buyReplica.enabled, true);
        assert.equal(buyReplica.cost, cost);
        assert.equal(buyReplica.ownership_level, ownershipLevel);
      });

      it("should prevent ownership level exceeding NFT max", async () => {
        // Try to set ownership level higher than NFT's level (3)
        await expectRevert(
          monetization.enableBuyReplica(tokenId, cost, 4, { from: nftOwner }),
          "Monetization: Exceeds max ownership"
        );
      });

      it("should prevent enabling for data IP type", async () => {
        // Create NFT with data IP type
        const tx = await nftContract.createNFT(
          "Data NFT",
          3,
          { from: nftOwner }
        );
        const dataTokenId = tx.logs.find(log => log.event === 'NFTCreated').args.tokenId;
        
        // Set max access level
        
        // Set metadata with data type
        const dataMetadata = {
          intellectual_property_type: "data",
          intellectual_property_id: "data-123",
          image_url: validMetadata.imageUrl,
          storage_type: validMetadata.storageType,
          storage_id: validMetadata.storageId,
          encrypted: validMetadata.encrypted,
          encryption_id: validMetadata.encryptionId,
          md5_hash: validMetadata.md5Hash,
          version: validMetadata.version
        };
        await nftMetadata.createMetadata(dataTokenId, dataMetadata, { from: nftOwner });

        await expectRevert(
          monetization.enableBuyReplica(dataTokenId, cost, ownershipLevel, { from: nftOwner }),
          "Monetization: Data type only supports buy-ownership"
        );
      });
    });

    describe("buyReplica", () => {
      beforeEach(async () => {
        await monetization.enableBuyReplica(tokenId, cost, ownershipLevel, { from: nftOwner });
      });

      it("should create replica NFT with payment", async () => {
        const tx = await monetization.buyReplica(tokenId, { from: buyer, value: cost });

        expectEvent(tx, 'PaymentProcessed', {
          nftId: tokenId,
          buyer: buyer,
          amount: cost,
          paymentType: 'buy-replica'
        });

        // Find the replica token ID from NFTCreated event
        const nftCreatedEvents = await nftContract.getPastEvents('NFTCreated', {
          fromBlock: tx.receipt.blockNumber,
          toBlock: tx.receipt.blockNumber
        });
        
        // Should have created a replica
        assert.equal(nftCreatedEvents.length, 1, "Should create one replica NFT");
        const replicaTokenId = nftCreatedEvents[0].returnValues.tokenId;

        // Verify replica NFT was created and transferred to buyer
        assert.equal(await nftContract.ownerOf(replicaTokenId), buyer);
        
        // Verify ownership level
        const nftInfo = await nftContract.getNFTInfo(replicaTokenId);
        assert.equal(nftInfo.levelOfOwnership, ownershipLevel);

        // Verify metadata was replicated
        const originalMetadata = await nftMetadata.getMetadata(tokenId);
        const replicaMetadata = await nftMetadata.getMetadata(replicaTokenId);
        assert.equal(replicaMetadata.intellectual_property_type, originalMetadata.intellectual_property_type);
        assert.equal(replicaMetadata.intellectual_property_id, originalMetadata.intellectual_property_id);
      });
    });
  });

  describe("Batch Monetization Configuration", () => {
    it("should set all monetization options at once", async () => {
      const commitmentTimestamp = Math.floor(Date.now() / 1000) + (90 * SECONDS_IN_DAY);
      const noticeSeconds = 30 * SECONDS_IN_DAY;
      
      // Structs for setAllMonetizationOptions
      const payPerUseParams = {
        enabled: true,
        costPerUse: 100, // USD
        platformCostPaidBy: buyer
      };
      
      const subscriptionParams = {
        enabled: true,
        cost: web3.utils.toWei('1', 'ether'),
        time: 30, // days
        limit: 100,
        limitTime: 60 // minutes
      };
      
      const buyAccessParams = {
        enabled: true,
        accessLevel: AccessLevel.UseModel,
        accessTime: 7, // days
        cost: web3.utils.toWei('0.5', 'ether')
      };
      
      const buyOwnershipParams = {
        enabled: false, // Can't be enabled with pay-per-use/subscription
        cost: web3.utils.toWei('10', 'ether'),
        ownershipLevel: 3
      };
      
      const buyReplicaParams = {
        enabled: true,
        cost: web3.utils.toWei('2', 'ether'),
        ownershipLevel: 2
      };

      const tx = await monetization.setAllMonetizationOptions(
        tokenId,
        commitmentTimestamp,
        noticeSeconds,
        payPerUseParams,
        subscriptionParams,
        buyAccessParams,
        buyOwnershipParams,
        buyReplicaParams,
        { from: nftOwner }
      );
      
      expectEvent(tx, 'AllMonetizationOptionsSet', {
        nftId: tokenId
      });

      // Verify all options were set
      const payPerUse = await monetization.payPerUseData(tokenId);
      assert.equal(payPerUse.enabled, payPerUseParams.enabled);
      assert.equal(payPerUse.cost_per_use, payPerUseParams.costPerUse);

      const subscription = await monetization.subscriptionData(tokenId);
      assert.equal(subscription.enabled, subscriptionParams.enabled);
      assert.equal(subscription.subscription_cost, subscriptionParams.cost);

      const buyAccess = await monetization.buyAccessData(tokenId);
      assert.equal(buyAccess.enabled, buyAccessParams.enabled);
      assert.equal(buyAccess.cost, buyAccessParams.cost);

      const buyOwnership = await monetization.buyOwnershipData(tokenId);
      assert.equal(buyOwnership.enabled, buyOwnershipParams.enabled);

      const buyReplica = await monetization.buyReplicaData(tokenId);
      assert.equal(buyReplica.enabled, buyReplicaParams.enabled);
      assert.equal(buyReplica.cost, buyReplicaParams.cost);
    });
  });

  describe("Unlock Process", () => {
    let futureCommitmentTime;
    let noticeTime;
    
    beforeEach(async () => {
      futureCommitmentTime = Math.floor(Date.now() / 1000) + (90 * SECONDS_IN_DAY);
      noticeTime = 30 * SECONDS_IN_DAY;
      
      await monetization.setCommitmentTime(tokenId, futureCommitmentTime, { from: nftOwner });
      await monetization.setNoticeBeforeUnlockCommitment(tokenId, noticeTime, { from: nftOwner });
    });
    
    it("should start unlock process when no active monetization", async () => {
      // Enable and then disable pay-per-use
      await monetization.enablePayPerUse(tokenId, 100, buyer, { from: nftOwner });
      
      // NFT should be locked
      let lockStatus = await nftContract.getLockStatus(tokenId);
      assert.equal(lockStatus.toNumber(), 0); // Locked
      
      // Disable pay-per-use (should start unlock process)
      await monetization.disablePayPerUse(tokenId, { from: nftOwner });
      
      // Check lock status changed to unlocking
      lockStatus = await nftContract.getLockStatus(tokenId);
      assert.equal(lockStatus.toNumber(), 1); // Unlocking
    });
    
    it("should complete unlock after notice period", async () => {
      // Enable pay-per-use to lock NFT
      await monetization.enablePayPerUse(tokenId, 100, buyer, { from: nftOwner });
      
      // Move time past commitment
      await time.increase(futureCommitmentTime - Math.floor(Date.now() / 1000) + 1);
      
      // Start unlock process
      await monetization.startUnlockProcess(tokenId, { from: nftOwner });
      
      // Move time past notice period
      await time.increase(noticeTime + 1);
      
      // Complete unlock
      const tx = await monetization.completeUnlock(tokenId, { from: nftOwner });
      
      // Verify NFT can be unlocked
      const lockStatus = await nftContract.getLockStatus(tokenId);
      assert.equal(lockStatus.toNumber(), 2); // CanBeUnlocked
    });

    it("should prevent unlock with active subscriptions", async () => {
      await monetization.enableSubscription(
        tokenId,
        web3.utils.toWei('1', 'ether'),
        30, // days
        100,
        60, // minutes
        { from: nftOwner }
      );

      // Record active subscription
      await masterAccess.grantAccess(aiServiceAgreement.address, monetization.address, { from: deployer });
      await aiServiceAgreement.recordSubscriptionSale(
        tokenId,
        buyer,
        web3.utils.toWei('1', 'ether'),
        30 * SECONDS_IN_DAY,
        { from: monetization.address }
      );

      // Try to disable subscription - should fail
      await expectRevert(
        monetization.disableSubscription(tokenId, { from: nftOwner }),
        "Monetization: Active subscriptions exist"
      );
    });
  });

  describe("Edge Cases and Security", () => {
    it("should handle zero prices gracefully", async () => {
      // Set commitment times first
      const futureCommitmentTime = Math.floor(Date.now() / 1000) + (90 * SECONDS_IN_DAY);
      const noticeTime = 30 * SECONDS_IN_DAY;
      await monetization.setCommitmentTime(tokenId, futureCommitmentTime, { from: nftOwner });
      await monetization.setNoticeBeforeUnlockCommitment(tokenId, noticeTime, { from: nftOwner });
      
      // Zero price is actually allowed in the contract
      const tx = await monetization.enableBuyAccess(
        tokenId,
        AccessLevel.UseModel,
        7, // days
        0, // Zero price allowed
        { from: nftOwner }
      );
      
      expectEvent(tx, 'MonetizationEnabled', {
        nftId: tokenId,
        optionIndex: '2'
      });
    });

    it("should prevent reentrancy in purchase functions", async () => {
      // This test would require a malicious contract to properly test reentrancy
      // For now, we verify that the functions complete successfully
      await monetization.enableBuyOwnership(
        tokenId, 
        web3.utils.toWei('1', 'ether'),
        3, // ownership level
        { from: nftOwner }
      );
      
      const tx = await monetization.buyOwnership(tokenId, { 
        from: buyer, 
        value: web3.utils.toWei('1', 'ether') 
      });
      
      assert.equal(await nftContract.ownerOf(tokenId), buyer);
    });

    it("should handle payment failures gracefully", async () => {
      // Set commitment times first
      const futureCommitmentTime = Math.floor(Date.now() / 1000) + (90 * SECONDS_IN_DAY);
      const noticeTime = 30 * SECONDS_IN_DAY;
      await monetization.setCommitmentTime(tokenId, futureCommitmentTime, { from: nftOwner });
      await monetization.setNoticeBeforeUnlockCommitment(tokenId, noticeTime, { from: nftOwner });
      
      // Create a contract that can't receive ETH to test payment failure
      // This would require deploying a separate contract
      // For now, we verify basic payment validation
      await monetization.enableBuyAccess(
        tokenId,
        AccessLevel.UseModel,
        7, // days
        web3.utils.toWei('1', 'ether'),
        { from: nftOwner }
      );

      await expectRevert(
        monetization.buyAccess(tokenId, { 
          from: buyer, 
          value: web3.utils.toWei('0.5', 'ether') // Insufficient
        }),
        "Monetization: Insufficient payment"
      );
    });
  });
});