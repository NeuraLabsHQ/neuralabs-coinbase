const MasterAccessControl = artifacts.require("MasterAccessControl");
const NFTAccessControl = artifacts.require("NFTAccessControl");
const NFTMetadata = artifacts.require("NFTMetadata");
const NFTContract = artifacts.require("NFTContract");
const Monetization = artifacts.require("Monetization");
const AIServiceAgreementManagement = artifacts.require("AIServiceAgreementManagement");
const { expectRevert, expectEvent, time, BN } = require('@openzeppelin/test-helpers');

contract("Integration Tests", (accounts) => {
  const [deployer, alice, bob, charlie, subscriptionHandler] = accounts;
  let masterAccess, nftAccess, nftMetadata, nftContract, monetization, aiServiceAgreement;
  
  // Constants
  const SECONDS_IN_DAY = 86400;
  const DEFAULT_COMMISSION = 10;
  
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

  beforeEach(async () => {
    // Deploy all contracts in correct order
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

    // Grant all necessary permissions
    await masterAccess.grantAccess(nftAccess.address, nftContract.address, { from: deployer });
    await masterAccess.grantAccess(nftMetadata.address, nftContract.address, { from: deployer });
    await masterAccess.grantAccess(nftContract.address, monetization.address, { from: deployer });
    await masterAccess.grantAccess(aiServiceAgreement.address, monetization.address, { from: deployer });
    await masterAccess.grantAccess(nftAccess.address, monetization.address, { from: deployer });
    await masterAccess.grantAccess(nftMetadata.address, monetization.address, { from: deployer });
    await masterAccess.grantAccess(aiServiceAgreement.address, nftContract.address, { from: deployer });
    
    // Complete setup
    await nftContract.setMonetizationContract(monetization.address, { from: deployer });
    await monetization.setContractReferences(subscriptionHandler, { from: deployer });
    await monetization.setCommissionPercentage(DEFAULT_COMMISSION, { from: deployer });
    await nftAccess.setAIServiceAgreementManagement(aiServiceAgreement.address, { from: deployer });
  });

  describe("End-to-End NFT Lifecycle", () => {
    it("should handle complete NFT lifecycle from creation to transfer", async () => {
      // 1. Create NFT
      const metadata = {
        ipType: "model",
        ipId: "ai-model-v1",
        imageUrl: "https://example.com/model.png",
        storageType: "neuralabs",
        storageId: "storage-001",
        encrypted: true,
        encryptionId: "enc-001",
        md5Hash: "abc123def456",
        version: "1.0.0"
      };

      const createTx = await nftContract.createNFT(
        alice,
        3, // Ownership level 3
        metadata.ipType,
        metadata.ipId,
        metadata.imageUrl,
        metadata.storageType,
        metadata.storageId,
        metadata.encrypted,
        metadata.encryptionId,
        metadata.md5Hash,
        metadata.version,
        { from: deployer }
      );

      const tokenId = createTx.logs.find(log => log.event === 'Transfer').args.tokenId;

      // 2. Verify NFT state
      assert.equal(await nftContract.ownerOf(tokenId), alice);
      assert.equal((await nftContract.nftOwnershipLevel(tokenId)).toNumber(), 3);
      assert.equal((await nftAccess.getUserAccessLevel(tokenId, alice)).toNumber(), AccessLevel.AbsoluteOwnership);

      // 3. Verify metadata
      const storedMetadata = await nftMetadata.getMetadata(tokenId);
      assert.equal(storedMetadata.ipType, metadata.ipType);
      assert.equal(storedMetadata.encrypted, metadata.encrypted);

      // 4. Grant additional access
      await masterAccess.grantAccess(nftAccess.address, alice, { from: deployer });
      await nftAccess.grantAccess(tokenId, bob, AccessLevel.UseModel, { from: alice });
      await nftAccess.grantAccess(tokenId, charlie, AccessLevel.ViewAndDownload, { from: alice });

      // 5. Transfer NFT
      await nftContract.transferFrom(alice, bob, tokenId, { from: alice });

      // 6. Verify new ownership and access
      assert.equal(await nftContract.ownerOf(tokenId), bob);
      assert.equal((await nftAccess.getUserAccessLevel(tokenId, alice)).toNumber(), AccessLevel.None);
      assert.equal((await nftAccess.getUserAccessLevel(tokenId, bob)).toNumber(), AccessLevel.AbsoluteOwnership);
      assert.equal((await nftAccess.getUserAccessLevel(tokenId, charlie)).toNumber(), AccessLevel.ViewAndDownload);
    });
  });

  describe("Monetization Flow with Access Protection", () => {
    let tokenId;

    beforeEach(async () => {
      // Create NFT
      const tx = await nftContract.createNFT(
        alice,
        4, // High ownership level for monetization
        "flow",
        "workflow-123",
        "https://example.com/flow.png",
        "neuralabs-decentralized",
        "ipfs-hash-123",
        false,
        "",
        "hash123",
        "1.0.0",
        { from: deployer }
      );
      tokenId = tx.logs.find(log => log.event === 'Transfer').args.tokenId;
      
      // Grant alice permission to manage monetization
      await masterAccess.grantAccess(monetization.address, alice, { from: deployer });
    });

    it("should protect paid access from revocation", async () => {
      // 1. Enable buy access monetization
      const accessPrice = web3.utils.toWei('0.5', 'ether');
      const accessDuration = 30 * SECONDS_IN_DAY;
      
      await monetization.enableBuyAccess(
        tokenId,
        accessPrice,
        accessDuration,
        AccessLevel.UseModel,
        7 * SECONDS_IN_DAY, // commitment time
        30 * SECONDS_IN_DAY, // notice time
        { from: alice }
      );

      // 2. Bob buys access
      await monetization.buyAccess(tokenId, { from: bob, value: accessPrice });

      // 3. Verify Bob has access and it's recorded
      assert.equal((await nftAccess.getUserAccessLevel(tokenId, bob)).toNumber(), AccessLevel.UseModel);
      assert.equal(await aiServiceAgreement.hasActiveAccess(tokenId, bob), true);

      // 4. Try to revoke Bob's access - should fail
      await masterAccess.grantAccess(nftAccess.address, alice, { from: deployer });
      await expectRevert(
        nftAccess.revokeAccess(tokenId, bob, { from: alice }),
        "User has paid access that cannot be revoked"
      );

      // 5. Try to reset all access - should fail
      await expectRevert(
        nftAccess.resetAccess(tokenId, { from: alice }),
        "Cannot reset: Users have paid access"
      );

      // 6. Fast forward past expiry
      await time.increase(time.duration.days(31));

      // 7. Now revocation should work
      await nftAccess.revokeAccess(tokenId, bob, { from: alice });
      assert.equal((await nftAccess.getUserAccessLevel(tokenId, bob)).toNumber(), AccessLevel.None);
    });
  });

  describe("Subscription Lifecycle", () => {
    let tokenId;

    beforeEach(async () => {
      const tx = await nftContract.createNFT(
        alice,
        5,
        "model",
        "subscription-model",
        "https://example.com/model.png",
        "neuralabs",
        "storage-sub-001",
        false,
        "",
        "hash456",
        "2.0.0",
        { from: deployer }
      );
      tokenId = tx.logs.find(log => log.event === 'Transfer').args.tokenId;
      
      await masterAccess.grantAccess(monetization.address, alice, { from: deployer });
    });

    it("should handle subscription purchase and renewal", async () => {
      // 1. Enable subscription
      const subPrice = web3.utils.toWei('1', 'ether');
      const subDuration = 30 * SECONDS_IN_DAY;
      const usageLimit = 100;
      
      await monetization.enableSubscription(
        tokenId,
        subPrice,
        subDuration,
        usageLimit,
        7 * SECONDS_IN_DAY,
        30 * SECONDS_IN_DAY,
        { from: alice }
      );

      // 2. Bob subscribes (subscription handler manages this)
      // For testing, we simulate by recording the subscription
      await masterAccess.grantAccess(aiServiceAgreement.address, subscriptionHandler, { from: deployer });
      const currentTime = await time.latest();
      const expiryTime = currentTime.add(new BN(subDuration));
      
      await aiServiceAgreement.recordSubscriptionSale(
        tokenId,
        bob,
        expiryTime,
        { from: subscriptionHandler }
      );

      // 3. Verify subscription is active
      assert.equal(await aiServiceAgreement.hasActiveSubscription(tokenId, bob), true);
      assert.equal((await aiServiceAgreement.activeSubscriptionsCount(tokenId)).toNumber(), 1);

      // 4. Try to disable subscription - should fail
      await expectRevert(
        monetization.disableSubscription(tokenId, { from: alice }),
        "Cannot disable with active subscriptions"
      );

      // 5. Try to unlock NFT - should fail
      const hasActiveAgreements = await aiServiceAgreement.hasActiveSubscriptions(tokenId);
      assert.equal(hasActiveAgreements, true);

      // 6. Fast forward near expiry and renew
      await time.increase(time.duration.days(25));
      
      const newExpiryTime = expiryTime.add(new BN(subDuration));
      await aiServiceAgreement.recordSubscriptionSale(
        tokenId,
        bob,
        newExpiryTime,
        { from: subscriptionHandler }
      );

      // 7. Verify extended subscription
      assert.equal(await aiServiceAgreement.hasActiveSubscription(tokenId, bob), true);
    });
  });

  describe("Buy Ownership Complete Flow", () => {
    let tokenId;

    beforeEach(async () => {
      const tx = await nftContract.createNFT(
        alice,
        6, // Highest ownership level
        "data",
        "dataset-premium",
        "https://example.com/data.png",
        "custom",
        "s3://bucket/data",
        true,
        "enc-premium",
        "hash789",
        "3.0.0",
        { from: deployer }
      );
      tokenId = tx.logs.find(log => log.event === 'Transfer').args.tokenId;
      
      await masterAccess.grantAccess(monetization.address, alice, { from: deployer });
    });

    it("should handle complete ownership transfer with all features", async () => {
      // 1. Set up complex access structure
      await masterAccess.grantAccess(nftAccess.address, alice, { from: deployer });
      await nftAccess.grantAccess(tokenId, bob, AccessLevel.ViewAndDownload, { from: alice });
      await nftAccess.grantAccess(tokenId, charlie, AccessLevel.UseModel, { from: alice });
      await nftAccess.setDefaultAccessLevel(tokenId, AccessLevel.UseModel, { from: alice });

      // 2. Enable buy ownership
      const ownershipPrice = web3.utils.toWei('50', 'ether');
      await monetization.enableBuyOwnership(tokenId, ownershipPrice, { from: alice });

      // 3. Verify NFT is locked
      assert.equal((await nftContract.lockStatus(tokenId)).toNumber(), 0); // Locked

      // 4. Record balances before purchase
      const aliceBalanceBefore = new BN(await web3.eth.getBalance(alice));
      const platformBalanceBefore = new BN(await web3.eth.getBalance(deployer));

      // 5. Bob buys ownership
      const purchaseTx = await monetization.buyOwnership(tokenId, { 
        from: bob, 
        value: ownershipPrice 
      });

      // 6. Verify ownership transferred
      assert.equal(await nftContract.ownerOf(tokenId), bob);
      assert.equal((await nftContract.lockStatus(tokenId)).toNumber(), 3); // Unlocked
      assert.equal((await nftAccess.getUserAccessLevel(tokenId, bob)).toNumber(), AccessLevel.AbsoluteOwnership);
      assert.equal((await nftAccess.getUserAccessLevel(tokenId, alice)).toNumber(), AccessLevel.None);

      // 7. Verify other users still have their access
      assert.equal((await nftAccess.getUserAccessLevel(tokenId, charlie)).toNumber(), AccessLevel.UseModel);

      // 8. Verify payments
      const commission = new BN(ownershipPrice).mul(new BN(DEFAULT_COMMISSION)).div(new BN(100));
      const alicePayment = new BN(ownershipPrice).sub(commission);
      
      const aliceBalanceAfter = new BN(await web3.eth.getBalance(alice));
      const platformBalanceAfter = new BN(await web3.eth.getBalance(deployer));
      
      assert.equal(
        aliceBalanceAfter.sub(aliceBalanceBefore).toString(),
        alicePayment.toString(),
        "Alice should receive payment minus commission"
      );

      // 9. Verify monetization is disabled
      const buyOwnership = await monetization.buyOwnership(tokenId);
      assert.equal(buyOwnership.enabled, false);
    });
  });

  describe("Replica Creation and Inheritance", () => {
    let originalTokenId;

    beforeEach(async () => {
      const tx = await nftContract.createNFT(
        alice,
        5,
        "model",
        "replicable-model",
        "https://example.com/original.png",
        "neuralabs",
        "storage-original",
        false,
        "",
        "hashabc",
        "1.0.0",
        { from: deployer }
      );
      originalTokenId = tx.logs.find(log => log.event === 'Transfer').args.tokenId;
      
      await masterAccess.grantAccess(monetization.address, alice, { from: deployer });
    });

    it("should create replica with proper inheritance", async () => {
      // 1. Set up original NFT with various features
      await masterAccess.grantAccess(nftAccess.address, alice, { from: deployer });
      await nftAccess.setDefaultAccessLevel(originalTokenId, AccessLevel.ViewAndDownload, { from: alice });
      await nftAccess.setMaximumAccessLevel(originalTokenId, AccessLevel.EditData, { from: alice });

      // 2. Enable buy replica
      const replicaPrice = web3.utils.toWei('5', 'ether');
      const replicaOwnershipLevel = 3;
      
      await monetization.enableBuyReplica(
        originalTokenId,
        replicaPrice,
        replicaOwnershipLevel,
        { from: alice }
      );

      // 3. Bob buys replica
      const replicaTx = await monetization.buyReplica(originalTokenId, { 
        from: bob, 
        value: replicaPrice 
      });

      // Find replica token ID
      const transferEvent = replicaTx.logs.find(
        log => log.event === 'Transfer' && log.args.to === bob
      );
      const replicaTokenId = transferEvent.args.tokenId;

      // 4. Verify replica properties
      assert.equal(await nftContract.ownerOf(replicaTokenId), bob);
      assert.equal((await nftContract.nftOwnershipLevel(replicaTokenId)).toNumber(), replicaOwnershipLevel);
      assert.equal((await nftAccess.getUserAccessLevel(replicaTokenId, bob)).toNumber(), AccessLevel.AbsoluteOwnership);

      // 5. Verify metadata was copied
      const originalMetadata = await nftMetadata.getMetadata(originalTokenId);
      const replicaMetadata = await nftMetadata.getMetadata(replicaTokenId);
      
      assert.equal(replicaMetadata.ipType, originalMetadata.ipType);
      assert.equal(replicaMetadata.ipId, originalMetadata.ipId);
      assert.equal(replicaMetadata.storageId, originalMetadata.storageId);
      assert.equal(replicaMetadata.creator, bob); // Creator should be the buyer

      // 6. Verify replica is independent
      await nftContract.transferFrom(bob, charlie, replicaTokenId, { from: bob });
      assert.equal(await nftContract.ownerOf(replicaTokenId), charlie);
      
      // Original should be unaffected
      assert.equal(await nftContract.ownerOf(originalTokenId), alice);
    });
  });

  describe("Complex Lock/Unlock Scenarios", () => {
    let tokenId;

    beforeEach(async () => {
      const tx = await nftContract.createNFT(
        alice,
        4,
        "flow",
        "complex-flow",
        "https://example.com/flow.png",
        "neuralabs",
        "storage-flow",
        false,
        "",
        "hashxyz",
        "1.0.0",
        { from: deployer }
      );
      tokenId = tx.logs.find(log => log.event === 'Transfer').args.tokenId;
      
      await masterAccess.grantAccess(monetization.address, alice, { from: deployer });
    });

    it("should handle commitment periods and notice requirements", async () => {
      // 1. Enable multiple monetization models with commitment periods
      const commitmentTime = 7 * SECONDS_IN_DAY;
      const noticeTime = 30 * SECONDS_IN_DAY;
      
      await monetization.setAllMonetizationOptions(
        tokenId,
        true, web3.utils.toWei('0.1', 'ether'), 1000, // Pay per use
        true, web3.utils.toWei('1', 'ether'), 30 * SECONDS_IN_DAY, 100, // Subscription
        true, web3.utils.toWei('0.5', 'ether'), 7 * SECONDS_IN_DAY, AccessLevel.UseModel, // Buy access
        false, 0, // Buy ownership disabled
        false, 0, 0, // Buy replica disabled
        commitmentTime,
        noticeTime,
        { from: alice }
      );

      // 2. NFT should be locked
      assert.equal((await nftContract.lockStatus(tokenId)).toNumber(), 0);

      // 3. Bob buys access
      await monetization.buyAccess(tokenId, { 
        from: bob, 
        value: web3.utils.toWei('0.5', 'ether') 
      });

      // 4. Disable all monetization models
      await monetization.disablePayPerUse(tokenId, { from: alice });
      await monetization.disableSubscription(tokenId, { from: alice });
      await monetization.disableBuyAccess(tokenId, { from: alice });

      // 5. Check unlock eligibility - should be false due to active agreement
      const canUnlock = await monetization.checkUnlockEligibility(tokenId);
      assert.equal(canUnlock, false);

      // 6. Fast forward past access expiry
      await time.increase(time.duration.days(8));

      // 7. Now should be able to unlock
      const canUnlockAfter = await monetization.checkUnlockEligibility(tokenId);
      assert.equal(canUnlockAfter, true);

      // 8. Alice initiates unlock
      await nftContract.initiateUnlock(tokenId, { from: alice });
      assert.equal((await nftContract.lockStatus(tokenId)).toNumber(), 1); // Unlocking

      // 9. Complete unlock after waiting period
      await time.increase(time.duration.days(3));
      await nftContract.completeUnlock(tokenId, { from: alice });
      assert.equal((await nftContract.lockStatus(tokenId)).toNumber(), 3); // Unlocked
    });
  });

  describe("Metadata Update with Access Control", () => {
    let tokenId;

    beforeEach(async () => {
      const tx = await nftContract.createNFT(
        alice,
        3,
        "model",
        "editable-model",
        "https://example.com/v1.png",
        "neuralabs",
        "storage-v1",
        false,
        "",
        "hash-v1",
        "1.0.0",
        { from: deployer }
      );
      tokenId = tx.logs.find(log => log.event === 'Transfer').args.tokenId;
    });

    it("should enforce access control for metadata updates", async () => {
      // 1. Grant Bob edit access
      await masterAccess.grantAccess(nftAccess.address, alice, { from: deployer });
      await nftAccess.grantAccess(tokenId, bob, AccessLevel.EditData, { from: alice });

      // 2. Bob can update metadata
      await nftMetadata.updateMetadata(
        tokenId,
        "model", // Must match original IP type
        "editable-model",
        "https://example.com/v2.png", // New image
        "neuralabs",
        "storage-v2", // New storage
        true, // Now encrypted
        "enc-v2",
        "hash-v2",
        "2.0.0",
        { from: bob }
      );

      // 3. Verify update
      const metadata = await nftMetadata.getMetadata(tokenId);
      assert.equal(metadata.imageUrl, "https://example.com/v2.png");
      assert.equal(metadata.version, "2.0.0");
      assert.equal(metadata.encrypted, true);

      // 4. Charlie without edit access cannot update
      await nftAccess.grantAccess(tokenId, charlie, AccessLevel.ViewAndDownload, { from: alice });
      
      await expectRevert(
        nftMetadata.updateMetadata(
          tokenId,
          "model",
          "editable-model",
          "https://example.com/v3.png",
          "neuralabs",
          "storage-v3",
          false,
          "",
          "hash-v3",
          "3.0.0",
          { from: charlie }
        ),
        "Insufficient access level"
      );
    });
  });

  describe("Error Recovery and Edge Cases", () => {
    it("should handle NFT burn with active monetization gracefully", async () => {
      // Create NFT
      const tx = await nftContract.createNFT(
        alice,
        4,
        "model",
        "burnable-model",
        "https://example.com/burn.png",
        "neuralabs",
        "storage-burn",
        false,
        "",
        "hash-burn",
        "1.0.0",
        { from: deployer }
      );
      const tokenId = tx.logs.find(log => log.event === 'Transfer').args.tokenId;

      // Enable monetization (NFT gets locked)
      await masterAccess.grantAccess(monetization.address, alice, { from: deployer });
      await monetization.enableBuyOwnership(tokenId, web3.utils.toWei('10', 'ether'), { from: alice });

      // Try to burn - should fail (locked)
      await expectRevert(
        nftContract.burnNFT(tokenId, { from: alice }),
        "Cannot burn locked NFT"
      );

      // Disable monetization
      await monetization.disableBuyOwnership(tokenId, { from: alice });

      // Unlock NFT
      await nftContract.initiateUnlock(tokenId, { from: alice });
      await time.increase(time.duration.days(3));
      await nftContract.completeUnlock(tokenId, { from: alice });

      // Now burn should work
      await nftContract.burnNFT(tokenId, { from: alice });

      // Verify everything is cleaned up
      await expectRevert(
        nftContract.ownerOf(tokenId),
        "ERC721: owner query for nonexistent token"
      );
      assert.equal(await nftMetadata.metadataExists(tokenId), false);
    });

    it("should handle maximum gas scenarios", async () => {
      // Create NFT with maximum complexity
      const tx = await nftContract.createNFT(
        alice,
        6,
        "model",
        "complex-model-with-very-long-id-to-test-gas-usage",
        "https://example.com/very-long-url-with-many-parameters-and-complex-structure.png",
        "neuralabs-decentralized",
        "ipfs://QmVeryLongHashToSimulateRealWorldDecentralizedStorageIdentifier",
        true,
        "encryption-id-with-complex-structure-and-metadata",
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "1.0.0-beta.1+build.123",
        { from: deployer }
      );
      const tokenId = tx.logs.find(log => log.event === 'Transfer').args.tokenId;

      // Grant access to multiple users
      await masterAccess.grantAccess(nftAccess.address, alice, { from: deployer });
      const users = accounts.slice(3, 8); // 5 users
      
      for (const user of users) {
        await nftAccess.grantAccess(
          tokenId, 
          user, 
          Math.floor(Math.random() * 5) + 1, // Random access level 1-5
          { from: alice }
        );
      }

      // Enable all monetization options
      await masterAccess.grantAccess(monetization.address, alice, { from: deployer });
      await monetization.setAllMonetizationOptions(
        tokenId,
        true, web3.utils.toWei('0.1', 'ether'), 10000,
        true, web3.utils.toWei('1', 'ether'), 365 * SECONDS_IN_DAY, 1000,
        true, web3.utils.toWei('0.5', 'ether'), 30 * SECONDS_IN_DAY, AccessLevel.UseModel,
        true, web3.utils.toWei('100', 'ether'),
        true, web3.utils.toWei('10', 'ether'), 3,
        30 * SECONDS_IN_DAY,
        90 * SECONDS_IN_DAY,
        { from: alice }
      );

      // Verify everything still works
      assert.equal(await nftContract.ownerOf(tokenId), alice);
      const metadata = await nftMetadata.getMetadata(tokenId);
      assert.equal(metadata.encrypted, true);
    });
  });
});