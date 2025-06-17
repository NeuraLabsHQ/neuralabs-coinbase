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
          expiryTime,
          { from: monetizationContract }
        );

        expectEvent(tx, 'AccessSaleRecorded', {
          tokenId: tokenId.toString(),
          user: user1,
          expiry: expiryTime
        });

        // Verify sale was recorded
        const hasPaidAccess = await aiServiceAgreement.hasPaidAccess(tokenId, user1);
        assert.equal(hasPaidAccess, true, "User should have paid access");

        // Verify active count increased
        const activeCount = await aiServiceAgreement.activeAccessSalesCount(tokenId);
        assert.equal(activeCount.toNumber(), 1, "Active access sales count should be 1");
      });

      it("should record permanent access with expiry 0", async () => {
        const tx = await aiServiceAgreement.recordAccessSale(
          tokenId,
          user1,
          0, // Permanent access
          { from: monetizationContract }
        );

        expectEvent(tx, 'AccessSaleRecorded', {
          tokenId: tokenId.toString(),
          user: user1,
          expiry: '0'
        });

        // Verify permanent access
        const accessSale = await aiServiceAgreement.accessSales(tokenId, user1);
        assert.equal(accessSale.exists, true);
        assert.equal(accessSale.expiry.toNumber(), 0);
        assert.equal(accessSale.isActive, true);
      });

      it("should prevent unauthorized caller from recording sale", async () => {
        await expectRevert(
          aiServiceAgreement.recordAccessSale(tokenId, user1, 0, { from: unauthorized }),
          "Unauthorized: Caller is not authorized"
        );
      });

      it("should update existing access sale", async () => {
        // Record initial sale
        const firstExpiry = (await time.latest()).add(new BN(duration));
        await aiServiceAgreement.recordAccessSale(tokenId, user1, firstExpiry, { from: monetizationContract });

        // Update with new expiry
        const newExpiry = firstExpiry.add(new BN(duration));
        await aiServiceAgreement.recordAccessSale(tokenId, user1, newExpiry, { from: monetizationContract });

        // Verify updated expiry
        const accessSale = await aiServiceAgreement.accessSales(tokenId, user1);
        assert.equal(accessSale.expiry.toString(), newExpiry.toString());

        // Active count should still be 1
        const activeCount = await aiServiceAgreement.activeAccessSalesCount(tokenId);
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
          currentTime.add(new BN(86400)),
          { from: monetizationContract }
        );
        
        // User2: Expires in 7 days
        await aiServiceAgreement.recordAccessSale(
          tokenId,
          user2,
          currentTime.add(new BN(604800)),
          { from: monetizationContract }
        );
        
        // User3: Permanent access
        await aiServiceAgreement.recordAccessSale(
          tokenId,
          user3,
          0,
          { from: monetizationContract }
        );
      });

      it("should correctly identify expired access", async () => {
        // Fast forward 2 days
        await time.increase(time.duration.days(2));

        // User1's access should be expired
        const user1Access = await aiServiceAgreement.accessSales(tokenId, user1);
        const user1HasAccess = await aiServiceAgreement.hasPaidAccess(tokenId, user1);
        assert.equal(user1Access.isActive, true, "Still marked as active until reevaluated");
        assert.equal(user1HasAccess, false, "Should not have access after expiry");

        // User2's access should still be valid
        const user2HasAccess = await aiServiceAgreement.hasPaidAccess(tokenId, user2);
        assert.equal(user2HasAccess, true, "Should still have access");

        // User3's permanent access should be valid
        const user3HasAccess = await aiServiceAgreement.hasPaidAccess(tokenId, user3);
        assert.equal(user3HasAccess, true, "Should have permanent access");
      });

      it("should reevaluate single user access", async () => {
        // Fast forward 2 days
        await time.increase(time.duration.days(2));

        const tx = await aiServiceAgreement.reevaluateAccess(tokenId, user1, { from: deployer });

        expectEvent(tx, 'AccessExpired', {
          tokenId: tokenId.toString(),
          user: user1
        });

        // Verify access is now inactive
        const accessSale = await aiServiceAgreement.accessSales(tokenId, user1);
        assert.equal(accessSale.isActive, false, "Should be marked inactive");

        // Verify active count decreased
        const activeCount = await aiServiceAgreement.activeAccessSalesCount(tokenId);
        assert.equal(activeCount.toNumber(), 2, "Active count should decrease");
      });

      it("should not affect non-expired access during reevaluation", async () => {
        const tx = await aiServiceAgreement.reevaluateAccess(tokenId, user2, { from: deployer });

        // Should not emit AccessExpired event
        const expiredEvents = tx.logs.filter(log => log.event === 'AccessExpired');
        assert.equal(expiredEvents.length, 0, "Should not expire active access");

        // Verify still active
        const accessSale = await aiServiceAgreement.accessSales(tokenId, user2);
        assert.equal(accessSale.isActive, true, "Should remain active");
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
          expiryTime,
          { from: monetizationContract }
        );

        expectEvent(tx, 'SubscriptionRecorded', {
          tokenId: tokenId.toString(),
          user: user1,
          expiry: expiryTime
        });

        // Verify subscription was recorded
        const hasActiveSubscription = await aiServiceAgreement.hasActiveSubscription(tokenId, user1);
        assert.equal(hasActiveSubscription, true, "User should have active subscription");

        // Verify active count
        const activeCount = await aiServiceAgreement.activeSubscriptionsCount(tokenId);
        assert.equal(activeCount.toNumber(), 1, "Active subscription count should be 1");
      });

      it("should update existing subscription", async () => {
        const currentTime = await time.latest();
        const firstExpiry = currentTime.add(new BN(2592000));
        
        // Record initial subscription
        await aiServiceAgreement.recordSubscriptionSale(tokenId, user1, firstExpiry, { from: monetizationContract });
        
        // Extend subscription
        const newExpiry = firstExpiry.add(new BN(2592000));
        await aiServiceAgreement.recordSubscriptionSale(tokenId, user1, newExpiry, { from: monetizationContract });

        // Verify updated expiry
        const subscription = await aiServiceAgreement.subscriptions(tokenId, user1);
        assert.equal(subscription.expiry.toString(), newExpiry.toString());

        // Active count should still be 1
        const activeCount = await aiServiceAgreement.activeSubscriptionsCount(tokenId);
        assert.equal(activeCount.toNumber(), 1);
      });

      it("should handle subscription expiry", async () => {
        const currentTime = await time.latest();
        const expiryTime = currentTime.add(new BN(86400)); // 1 day
        
        await aiServiceAgreement.recordSubscriptionSale(tokenId, user1, expiryTime, { from: monetizationContract });

        // Fast forward 2 days
        await time.increase(time.duration.days(2));

        // Check subscription status
        const hasActiveSubscription = await aiServiceAgreement.hasActiveSubscription(tokenId, user1);
        assert.equal(hasActiveSubscription, false, "Subscription should be expired");

        // Reevaluate
        const tx = await aiServiceAgreement.reevaluateSubscription(tokenId, user1, { from: deployer });

        expectEvent(tx, 'SubscriptionExpired', {
          tokenId: tokenId.toString(),
          user: user1
        });

        // Verify marked as inactive
        const subscription = await aiServiceAgreement.subscriptions(tokenId, user1);
        assert.equal(subscription.isActive, false);
      });
    });

    describe("hasActiveSubscriptions", () => {
      it("should correctly identify tokens with active subscriptions", async () => {
        // No subscriptions initially
        let hasActive = await aiServiceAgreement.hasActiveSubscriptions(tokenId);
        assert.equal(hasActive, false, "Should have no active subscriptions");

        // Add subscription
        const expiry = (await time.latest()).add(new BN(2592000));
        await aiServiceAgreement.recordSubscriptionSale(tokenId, user1, expiry, { from: monetizationContract });

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
        currentTime.add(new BN(604800)), // 7 days
        { from: monetizationContract }
      );
      
      // User2: Has subscription
      await aiServiceAgreement.recordSubscriptionSale(
        tokenId,
        user2,
        currentTime.add(new BN(2592000)), // 30 days
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

    describe("hasPaidAccess", () => {
      it("should check only access sales, not subscriptions", async () => {
        const user1HasPaid = await aiServiceAgreement.hasPaidAccess(tokenId, user1);
        const user2HasPaid = await aiServiceAgreement.hasPaidAccess(tokenId, user2);

        assert.equal(user1HasPaid, true, "User1 should have paid access");
        assert.equal(user2HasPaid, false, "User2 should not have paid access (has subscription)");
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
        currentTime.add(new BN(86400)), // Expires in 1 day
        { from: monetizationContract }
      );
      
      await aiServiceAgreement.recordAccessSale(
        tokenId,
        users[1],
        currentTime.add(new BN(172800)), // Expires in 2 days
        { from: monetizationContract }
      );
      
      await aiServiceAgreement.recordSubscriptionSale(
        tokenId,
        users[2],
        currentTime.add(new BN(86400)), // Expires in 1 day
        { from: monetizationContract }
      );
      
      await aiServiceAgreement.recordSubscriptionSale(
        tokenId,
        users[3],
        currentTime.add(new BN(604800)), // Expires in 7 days
        { from: monetizationContract }
      );
    });

    describe("batchReevaluateAccess", () => {
      it("should reevaluate multiple users' access", async () => {
        // Fast forward 1.5 days
        await time.increase(time.duration.days(1.5));

        const tx = await aiServiceAgreement.batchReevaluateAccess(
          tokenId,
          [users[0], users[1]],
          { from: deployer }
        );

        // Should expire users[0] but not users[1]
        const expiredEvents = tx.logs.filter(log => log.event === 'AccessExpired');
        assert.equal(expiredEvents.length, 1, "Should expire one access");
        assert.equal(expiredEvents[0].args.user, users[0], "Should expire correct user");

        // Verify states
        const user0Access = await aiServiceAgreement.accessSales(tokenId, users[0]);
        const user1Access = await aiServiceAgreement.accessSales(tokenId, users[1]);
        assert.equal(user0Access.isActive, false, "User0 should be inactive");
        assert.equal(user1Access.isActive, true, "User1 should still be active");
      });

      it("should handle empty user array", async () => {
        const tx = await aiServiceAgreement.batchReevaluateAccess(tokenId, [], { from: deployer });
        assert.equal(tx.logs.length, 0, "Should not emit any events");
      });
    });

    describe("batchReevaluateSubscriptions", () => {
      it("should reevaluate multiple subscriptions", async () => {
        // Fast forward 1.5 days
        await time.increase(time.duration.days(1.5));

        const tx = await aiServiceAgreement.batchReevaluateSubscriptions(
          tokenId,
          [users[2], users[3]],
          { from: deployer }
        );

        // Should expire users[2] but not users[3]
        const expiredEvents = tx.logs.filter(log => log.event === 'SubscriptionExpired');
        assert.equal(expiredEvents.length, 1, "Should expire one subscription");
        assert.equal(expiredEvents[0].args.user, users[2], "Should expire correct user");

        // Verify states
        const user2Sub = await aiServiceAgreement.subscriptions(tokenId, users[2]);
        const user3Sub = await aiServiceAgreement.subscriptions(tokenId, users[3]);
        assert.equal(user2Sub.isActive, false, "User2 should be inactive");
        assert.equal(user3Sub.isActive, true, "User3 should still be active");
      });
    });

    describe("batchReevaluate", () => {
      it("should reevaluate both access sales and subscriptions", async () => {
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
        const activeAccessCount = await aiServiceAgreement.activeAccessSalesCount(tokenId);
        const activeSubCount = await aiServiceAgreement.activeSubscriptionsCount(tokenId);
        
        assert.equal(activeAccessCount.toNumber(), 1, "Should have 1 active access sale");
        assert.equal(activeSubCount.toNumber(), 1, "Should have 1 active subscription");
      });
    });
  });

  describe("Edge Cases and Security", () => {
    it("should handle reevaluation of non-existent records", async () => {
      // Should not revert
      const tx = await aiServiceAgreement.reevaluateAccess(1, user1, { from: deployer });
      
      // Should not emit any events
      assert.equal(tx.logs.length, 0, "Should not emit events for non-existent records");
    });

    it("should handle very large token IDs", async () => {
      const largeTokenId = new BN("115792089237316195423570985008687907853269984665640564039457584007913129639935");
      const expiry = (await time.latest()).add(new BN(86400));
      
      await aiServiceAgreement.recordAccessSale(
        largeTokenId,
        user1,
        expiry,
        { from: monetizationContract }
      );

      const hasAccess = await aiServiceAgreement.hasActiveAccess(largeTokenId, user1);
      assert.equal(hasAccess, true, "Should handle large token IDs");
    });

    it("should maintain data integrity with multiple updates", async () => {
      const tokenId = 1;
      const currentTime = await time.latest();
      
      // Initial state
      await aiServiceAgreement.recordAccessSale(tokenId, user1, currentTime.add(new BN(86400)), { from: monetizationContract });
      await aiServiceAgreement.recordSubscriptionSale(tokenId, user1, currentTime.add(new BN(172800)), { from: monetizationContract });
      
      // Verify both are active
      assert.equal(await aiServiceAgreement.hasPaidAccess(tokenId, user1), true);
      assert.equal(await aiServiceAgreement.hasActiveSubscription(tokenId, user1), true);
      
      // Update access to expire earlier
      await aiServiceAgreement.recordAccessSale(tokenId, user1, currentTime.add(new BN(3600)), { from: monetizationContract });
      
      // Fast forward 2 hours
      await time.increase(time.duration.hours(2));
      
      // Access should be expired, subscription still active
      assert.equal(await aiServiceAgreement.hasPaidAccess(tokenId, user1), false);
      assert.equal(await aiServiceAgreement.hasActiveSubscription(tokenId, user1), true);
      assert.equal(await aiServiceAgreement.hasActiveAccess(tokenId, user1), true); // Still has subscription
    });

    it("should prevent unauthorized access to all functions", async () => {
      const tokenId = 1;
      const expiry = (await time.latest()).add(new BN(86400));
      
      await expectRevert(
        aiServiceAgreement.recordAccessSale(tokenId, user1, expiry, { from: unauthorized }),
        "Unauthorized: Caller is not authorized"
      );
      
      await expectRevert(
        aiServiceAgreement.recordSubscriptionSale(tokenId, user1, expiry, { from: unauthorized }),
        "Unauthorized: Caller is not authorized"
      );
    });
  });
});