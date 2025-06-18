const AIServiceAgreementManagement = artifacts.require("AIServiceAgreementManagement");
const MasterAccessControl = artifacts.require("MasterAccessControl");
const NFTAccessControl = artifacts.require("NFTAccessControl");
const { expectRevert, expectEvent, time, BN } = require('@openzeppelin/test-helpers');

contract("AIServiceAgreementManagement", (accounts) => {
  const [deployer, monetizationContract, user1, user2, user3, unauthorized] = accounts;
  let aiServiceAgreement, masterAccess, nftAccess;
  
  beforeEach(async () => {
    // Deploy contracts
    masterAccess = await MasterAccessControl.new({ from: deployer });
    nftAccess = await NFTAccessControl.new(masterAccess.address, { from: deployer });
    aiServiceAgreement = await AIServiceAgreementManagement.new(
      masterAccess.address,
      nftAccess.address,
      { from: deployer }
    );
    
    // Set up permissions
    await masterAccess.grantAccess(aiServiceAgreement.address, monetizationContract, { from: deployer });
    await nftAccess.setAIServiceAgreementManagement(aiServiceAgreement.address, { from: deployer });
  });

  describe("Deployment", () => {
    it("should set correct initial values", async () => {
      assert.equal(await aiServiceAgreement.masterAccessControl(), masterAccess.address);
      assert.equal(await aiServiceAgreement.nftAccessControl(), nftAccess.address);
    });
  });

  describe("Access Sales Management", () => {
    const tokenId = 1;
    const duration = 7 * 24 * 60 * 60; // 7 days in seconds

    describe("recordAccessSale", () => {
      it("should record an access sale with expiry", async () => {
        const currentTime = await time.latest();
        const expiryTime = currentTime.add(new BN(duration));
        
        const tx = await aiServiceAgreement.recordAccessSale(
          tokenId,
          user1,
          web3.utils.toWei('1', 'ether'), // amount
          duration, // duration in seconds
          5, // AccessLevel.EditData
          { from: monetizationContract }
        );

        const expectedExpiry = currentTime.add(new BN(duration));
        expectEvent(tx, 'AccessSaleRecorded', {
          nftId: tokenId.toString(),
          user: user1,
          amount: web3.utils.toWei('1', 'ether'),
          expiry: expectedExpiry
        });

        // Verify sale was recorded
        const hasAccess = await aiServiceAgreement.hasActiveAccess(tokenId, user1);
        assert.equal(hasAccess, true, "User should have active access");

        // Verify active count increased
        const activeCount = await aiServiceAgreement.total_active_access_sales(tokenId);
        assert.equal(activeCount.toNumber(), 1, "Active access sales count should be 1");
      });

      it("should record permanent access with expiry 0", async () => {
        const tx = await aiServiceAgreement.recordAccessSale(
          tokenId,
          user1,
          web3.utils.toWei('2', 'ether'), // amount
          0, // duration 0 = permanent
          6, // AccessLevel.AbsoluteOwnership
          { from: monetizationContract }
        );

        expectEvent(tx, 'AccessSaleRecorded', {
          nftId: tokenId.toString(),
          user: user1,
          amount: web3.utils.toWei('2', 'ether'),
          expiry: '0'
        });

        // Verify permanent access
        const accessSale = await aiServiceAgreement.getAccessSaleDetails(tokenId, user1);
        assert.equal(accessSale.active, true);
        assert.equal(accessSale.expiry_date.toNumber(), 0);
        assert.equal(accessSale.amount.toString(), web3.utils.toWei('2', 'ether'));
      });

      it("should prevent unauthorized caller from recording sale", async () => {
        await expectRevert(
          aiServiceAgreement.recordAccessSale(tokenId, user1, web3.utils.toWei('1', 'ether'), 0, 5, { from: unauthorized }),
          "AIServiceAgreementManagement: Caller not authorized"
        );
      });

      it("should update existing access sale", async () => {
        // Record initial sale
        const firstExpiry = (await time.latest()).add(new BN(duration));
        await aiServiceAgreement.recordAccessSale(tokenId, user1, web3.utils.toWei('1', 'ether'), duration, 5, { from: monetizationContract });

        // Update with new expiry
        const newExpiry = firstExpiry.add(new BN(duration));
        await aiServiceAgreement.recordAccessSale(tokenId, user1, web3.utils.toWei('2', 'ether'), duration * 2, 5, { from: monetizationContract });

        // Verify updated access sale details
        const accessSale = await aiServiceAgreement.getAccessSaleDetails(tokenId, user1);
        assert.equal(accessSale.amount.toString(), web3.utils.toWei('2', 'ether'));

        // Active count should still be 1
        const activeCount = await aiServiceAgreement.total_active_access_sales(tokenId);
        assert.equal(activeCount.toNumber(), 1);
      });
    });

    describe("Access expiry and reevaluation", () => {
      beforeEach(async () => {
        // Record access sales with different expiry times
        const currentTime = await time.latest();
        
        // User1: Expires in 1 day
        await aiServiceAgreement.recordAccessSale(
          tokenId,
          user1,
          web3.utils.toWei('1', 'ether'),
          86400, // 1 day in seconds
          5, // AccessLevel.EditData
          { from: monetizationContract }
        );
        
        // User2: Expires in 7 days
        await aiServiceAgreement.recordAccessSale(
          tokenId,
          user2,
          web3.utils.toWei('1', 'ether'),
          604800, // 7 days in seconds
          5, // AccessLevel.EditData
          { from: monetizationContract }
        );
        
        // User3: Permanent access
        await aiServiceAgreement.recordAccessSale(
          tokenId,
          user3,
          web3.utils.toWei('1', 'ether'),
          0, // 0 duration = permanent
          5, // AccessLevel.EditData
          { from: monetizationContract }
        );
      });

      it("should correctly identify expired access", async () => {
        // Fast forward 2 days
        await time.increase(time.duration.days(2));

        // User1's access should be expired
        const user1HasAccess = await aiServiceAgreement.hasActiveAccess(tokenId, user1);
        assert.equal(user1HasAccess, false, "Should not have access after expiry");

        // User2's access should still be valid
        const user2HasAccess = await aiServiceAgreement.hasActiveAccess(tokenId, user2);
        assert.equal(user2HasAccess, true, "Should still have access");

        // User3's permanent access should be valid
        const user3HasAccess = await aiServiceAgreement.hasActiveAccess(tokenId, user3);
        assert.equal(user3HasAccess, true, "Should have permanent access");
      });

      it("should handle batch reevaluation for expired access", async () => {
        // Fast forward 2 days
        await time.increase(time.duration.days(2));

        // Grant NFT ownership to deployer for testing
        await nftAccess.grantAccess(tokenId, deployer, 6, { from: deployer }); // AbsoluteOwnership

        const tx = await aiServiceAgreement.batchReevaluate(tokenId, [user1, user2, user3], { from: deployer });

        expectEvent(tx, 'AccessExpired', {
          nftId: tokenId.toString(),
          user: user1
        });

        // Verify user1 access is now inactive
        const user1Details = await aiServiceAgreement.getAccessSaleDetails(tokenId, user1);
        assert.equal(user1Details.active, false, "User1 should be marked inactive");

        // Verify active count decreased
        const activeCount = await aiServiceAgreement.total_active_access_sales(tokenId);
        assert.equal(activeCount.toNumber(), 2, "Active count should decrease");
      });

      it("should not affect non-expired access during batch reevaluation", async () => {
        // Grant NFT ownership to deployer for testing
        await nftAccess.grantAccess(tokenId, deployer, 6, { from: deployer }); // AbsoluteOwnership
        
        const tx = await aiServiceAgreement.batchReevaluate(tokenId, [user2], { from: deployer });

        // Should not emit AccessExpired event
        const expiredEvents = tx.logs.filter(log => log.event === 'AccessExpired');
        assert.equal(expiredEvents.length, 0, "Should not expire active access");

        // Verify still active
        const accessSale = await aiServiceAgreement.getAccessSaleDetails(tokenId, user2);
        assert.equal(accessSale.active, true, "Should remain active");
      });
    });
  });

  describe("Subscription Management", () => {
    const tokenId = 1;

    describe("recordSubscriptionSale", () => {
      it("should record a subscription sale", async () => {
        const currentTime = await time.latest();
        const expiryTime = currentTime.add(new BN(2592000)); // 30 days
        
        const tx = await aiServiceAgreement.recordSubscriptionSale(
          tokenId,
          user1,
          web3.utils.toWei('0.1', 'ether'), // amount
          2592000, // 30 days duration in seconds
          { from: monetizationContract }
        );

        const expectedEndDate = currentTime.add(new BN(2592000));
        expectEvent(tx, 'SubscriptionRecorded', {
          nftId: tokenId.toString(),
          user: user1,
          amount: web3.utils.toWei('0.1', 'ether'),
          endDate: expectedEndDate
        });

        // Verify subscription was recorded via hasActiveAccess
        const hasAccess = await aiServiceAgreement.hasActiveAccess(tokenId, user1);
        assert.equal(hasAccess, true, "User should have active access via subscription");

        // Verify active count
        const activeCount = await aiServiceAgreement.total_active_subscriptions(tokenId);
        assert.equal(activeCount.toNumber(), 1, "Active subscription count should be 1");
      });

      it("should update existing subscription", async () => {
        const currentTime = await time.latest();
        const firstExpiry = currentTime.add(new BN(2592000));
        
        // Record initial subscription
        await aiServiceAgreement.recordSubscriptionSale(tokenId, user1, web3.utils.toWei('0.1', 'ether'), 2592000, { from: monetizationContract });
        
        // Extend subscription
        const newExpiry = firstExpiry.add(new BN(2592000));
        await aiServiceAgreement.recordSubscriptionSale(tokenId, user1, web3.utils.toWei('0.2', 'ether'), 5184000, { from: monetizationContract }); // 60 days

        // Verify updated subscription details
        const subscription = await aiServiceAgreement.getSubscriptionDetails(tokenId, user1);
        assert.equal(subscription.amount.toString(), web3.utils.toWei('0.2', 'ether'));

        // Active count should still be 1
        const activeCount = await aiServiceAgreement.total_active_subscriptions(tokenId);
        assert.equal(activeCount.toNumber(), 1);
      });

      it("should handle subscription expiry", async () => {
        const currentTime = await time.latest();
        const expiryTime = currentTime.add(new BN(86400)); // 1 day
        
        await aiServiceAgreement.recordSubscriptionSale(tokenId, user1, web3.utils.toWei('0.1', 'ether'), 86400, { from: monetizationContract }); // 1 day

        // Fast forward 2 days
        await time.increase(time.duration.days(2));

        // Check subscription status
        const hasAccess = await aiServiceAgreement.hasActiveAccess(tokenId, user1);
        assert.equal(hasAccess, false, "Subscription should be expired");

        // Grant NFT ownership to deployer for testing batch reevaluate
        await nftAccess.grantAccess(tokenId, deployer, 6, { from: deployer }); // AbsoluteOwnership
        
        // Reevaluate
        const tx = await aiServiceAgreement.batchReevaluate(tokenId, [user1], { from: deployer });

        expectEvent(tx, 'SubscriptionExpired', {
          nftId: tokenId.toString(),
          user: user1
        });

        // Verify marked as inactive
        const subscription = await aiServiceAgreement.getSubscriptionDetails(tokenId, user1);
        assert.equal(subscription.active, false);
      });
    });

    describe("hasActiveSubscriptions", () => {
      it("should correctly identify tokens with active subscriptions", async () => {
        // No subscriptions initially
        let hasActive = await aiServiceAgreement.hasActiveSubscriptions(tokenId);
        assert.equal(hasActive, false, "Should have no active subscriptions");

        // Add subscription
        const expiry = (await time.latest()).add(new BN(2592000));
        await aiServiceAgreement.recordSubscriptionSale(tokenId, user1, web3.utils.toWei('0.1', 'ether'), 2592000, { from: monetizationContract });

        hasActive = await aiServiceAgreement.hasActiveSubscriptions(tokenId);
        assert.equal(hasActive, true, "Should have active subscriptions");
      });
    });
  });

  describe("Comprehensive Access Checking", () => {
    const tokenId = 1;

    beforeEach(async () => {
      const currentTime = await time.latest();
      
      // User1: Has access sale
      await aiServiceAgreement.recordAccessSale(
        tokenId,
        user1,
        web3.utils.toWei('1', 'ether'),
        604800, // 7 days
        5, // AccessLevel.EditData
        { from: monetizationContract }
      );
      
      // User2: Has subscription
      await aiServiceAgreement.recordSubscriptionSale(
        tokenId,
        user2,
        web3.utils.toWei('0.1', 'ether'),
        2592000, // 30 days
        { from: monetizationContract }
      );
    });

    describe("hasActiveAccess", () => {
      it("should return true for user with access sale", async () => {
        const hasAccess = await aiServiceAgreement.hasActiveAccess(tokenId, user1);
        assert.equal(hasAccess, true, "User1 should have active access");
      });

      it("should return true for user with subscription", async () => {
        const hasAccess = await aiServiceAgreement.hasActiveAccess(tokenId, user2);
        assert.equal(hasAccess, true, "User2 should have active access");
      });

      it("should return false for user with no access", async () => {
        const hasAccess = await aiServiceAgreement.hasActiveAccess(tokenId, user3);
        assert.equal(hasAccess, false, "User3 should not have active access");
      });

      it("should return false after expiry", async () => {
        // Fast forward 8 days (past user1's access expiry)
        await time.increase(time.duration.days(8));

        const hasAccess = await aiServiceAgreement.hasActiveAccess(tokenId, user1);
        assert.equal(hasAccess, false, "User1 should not have access after expiry");

        // User2 should still have access
        const user2HasAccess = await aiServiceAgreement.hasActiveAccess(tokenId, user2);
        assert.equal(user2HasAccess, true, "User2 should still have access");
      });
    });

    describe("getTotalActiveAccess", () => {
      it("should return sum of access sales and subscriptions", async () => {
        const totalActive = await aiServiceAgreement.getTotalActiveAccess(tokenId);
        assert.equal(totalActive.toNumber(), 2, "Should have 2 total active access (1 sale + 1 subscription)");
      });
    });
  });

  describe("Batch Operations", () => {
    const tokenId = 1;
    const users = [accounts[3], accounts[4], accounts[5], accounts[6]];

    beforeEach(async () => {
      const currentTime = await time.latest();
      
      // Set up various expiry times
      await aiServiceAgreement.recordAccessSale(
        tokenId,
        users[0],
        web3.utils.toWei('1', 'ether'),
        86400, // Expires in 1 day
        5, // AccessLevel.EditData
        { from: monetizationContract }
      );
      
      await aiServiceAgreement.recordAccessSale(
        tokenId,
        users[1],
        web3.utils.toWei('1', 'ether'),
        172800, // Expires in 2 days
        5, // AccessLevel.EditData
        { from: monetizationContract }
      );
      
      await aiServiceAgreement.recordSubscriptionSale(
        tokenId,
        users[2],
        web3.utils.toWei('0.1', 'ether'),
        86400, // Expires in 1 day
        { from: monetizationContract }
      );
      
      await aiServiceAgreement.recordSubscriptionSale(
        tokenId,
        users[3],
        web3.utils.toWei('0.1', 'ether'),
        604800, // Expires in 7 days
        { from: monetizationContract }
      );
    });

    describe("batchReevaluate with ownership", () => {
      beforeEach(async () => {
        // Grant NFT ownership to deployer for testing
        await nftAccess.grantAccess(tokenId, deployer, 6, { from: deployer }); // AbsoluteOwnership
      });

      it("should reevaluate multiple users' access and subscriptions", async () => {
        // Fast forward 1.5 days
        await time.increase(time.duration.days(1.5));

        const tx = await aiServiceAgreement.batchReevaluate(
          tokenId,
          users, // All 4 users
          { from: deployer }
        );

        // Should expire users[0] (access) and users[2] (subscription)
        const accessExpiredEvents = tx.logs.filter(log => log.event === 'AccessExpired');
        const subExpiredEvents = tx.logs.filter(log => log.event === 'SubscriptionExpired');
        
        assert.equal(accessExpiredEvents.length, 1, "Should expire one access");
        assert.equal(subExpiredEvents.length, 1, "Should expire one subscription");

        // Verify active counts
        const activeAccessCount = await aiServiceAgreement.total_active_access_sales(tokenId);
        const activeSubCount = await aiServiceAgreement.total_active_subscriptions(tokenId);
        
        assert.equal(activeAccessCount.toNumber(), 1, "Should have 1 active access sale");
        assert.equal(activeSubCount.toNumber(), 1, "Should have 1 active subscription");
      });
    });

  });

  describe("Edge Cases and Security", () => {
    it("should handle reevaluation of non-existent records", async () => {
      // Grant NFT ownership to deployer for testing
      await nftAccess.grantAccess(1, deployer, 6, { from: deployer }); // AbsoluteOwnership
      
      // Should not revert
      const tx = await aiServiceAgreement.batchReevaluate(1, [user1], { from: deployer });
      
      // Should not emit any events
      assert.equal(tx.logs.length, 0, "Should not emit events for non-existent records");
    });

    it("should handle very large token IDs", async () => {
      const largeTokenId = new BN("115792089237316195423570985008687907853269984665640564039457584007913129639935");
      const expiry = (await time.latest()).add(new BN(86400));
      
      await aiServiceAgreement.recordAccessSale(
        largeTokenId,
        user1,
        web3.utils.toWei('1', 'ether'),
        86400, // 1 day duration
        5, // AccessLevel.EditData
        { from: monetizationContract }
      );

      const hasAccess = await aiServiceAgreement.hasActiveAccess(largeTokenId, user1);
      assert.equal(hasAccess, true, "Should handle large token IDs");
    });

    it("should maintain data integrity with multiple updates", async () => {
      const tokenId = 1;
      const currentTime = await time.latest();
      
      // Initial state
      await aiServiceAgreement.recordAccessSale(tokenId, user1, web3.utils.toWei('1', 'ether'), 86400, 5, { from: monetizationContract });
      await aiServiceAgreement.recordSubscriptionSale(tokenId, user1, web3.utils.toWei('0.1', 'ether'), 172800, { from: monetizationContract });
      
      // Verify both are active via hasActiveAccess
      assert.equal(await aiServiceAgreement.hasActiveAccess(tokenId, user1), true);
      
      // Update access to expire earlier
      await aiServiceAgreement.recordAccessSale(tokenId, user1, web3.utils.toWei('1', 'ether'), 3600, 5, { from: monetizationContract });
      
      // Fast forward 2 hours
      await time.increase(time.duration.hours(2));
      
      // Should still have active access via subscription
      assert.equal(await aiServiceAgreement.hasActiveAccess(tokenId, user1), true);
    });

    it("should prevent unauthorized access to all functions", async () => {
      const tokenId = 1;
      const expiry = (await time.latest()).add(new BN(86400));
      
      await expectRevert(
        aiServiceAgreement.recordAccessSale(tokenId, user1, web3.utils.toWei('1', 'ether'), 86400, 5, { from: unauthorized }),
        "AIServiceAgreementManagement: Caller not authorized"
      );
      
      await expectRevert(
        aiServiceAgreement.recordSubscriptionSale(tokenId, user1, web3.utils.toWei('0.1', 'ether'), 86400, { from: unauthorized }),
        "AIServiceAgreementManagement: Caller not authorized"
      );
    });
  });
});