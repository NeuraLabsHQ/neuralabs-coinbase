const MasterAccessControl = artifacts.require("MasterAccessControl");
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');

contract("MasterAccessControl", (accounts) => {
  const [deployer, contractA, contractB, user1, user2, unauthorized] = accounts;
  let masterAccess;

  beforeEach(async () => {
    masterAccess = await MasterAccessControl.new({ from: deployer });
  });

  describe("Deployment", () => {
    it("should grant deployer access to self on deployment", async () => {
      const hasAccess = await masterAccess.hasAccess(masterAccess.address, deployer);
      assert.equal(hasAccess, true, "Deployer should have access to MasterAccessControl");
    });

  });

  describe("Access Management", () => {
    describe("grantAccess", () => {
      it("should allow authorized caller to grant access", async () => {
        // Grant access from deployer to user1 for contractA
        const tx = await masterAccess.grantAccess(contractA, user1, { from: deployer });
        
        expectEvent(tx, 'AccessGranted', {
          contractAddress: contractA,
          callerAddress: user1
        });

        const hasAccess = await masterAccess.hasAccess(contractA, user1);
        assert.equal(hasAccess, true, "User1 should have access to contractA");
      });

      it("should prevent unauthorized caller from granting access", async () => {
        await expectRevert(
          masterAccess.grantAccess(contractA, user1, { from: unauthorized }),
          "MasterAccessControl: Caller not authorized"
        );
      });

      it("should handle granting access that already exists", async () => {
        await masterAccess.grantAccess(contractA, user1, { from: deployer });
        
        // Grant access again - should not revert
        const tx = await masterAccess.grantAccess(contractA, user1, { from: deployer });
        expectEvent(tx, 'AccessGranted', {
          contractAddress: contractA,
          callerAddress: user1
        });
      });
    });

    describe("revokeAccess", () => {
      beforeEach(async () => {
        await masterAccess.grantAccess(contractA, user1, { from: deployer });
      });

      it("should allow authorized caller to revoke access", async () => {
        const tx = await masterAccess.revokeAccess(contractA, user1, { from: deployer });
        
        expectEvent(tx, 'AccessRevoked', {
          contractAddress: contractA,
          caller: user1
        });

        const hasAccess = await masterAccess.hasAccess(contractA, user1);
        assert.equal(hasAccess, false, "User1 should not have access to contractA");
      });

      it("should prevent unauthorized caller from revoking access", async () => {
        await expectRevert(
          masterAccess.revokeAccess(contractA, user1, { from: unauthorized }),
          "MasterAccessControl: Caller not authorized"
        );
      });

      it("should handle revoking access that doesn't exist", async () => {
        // Revoke access that was never granted
        const tx = await masterAccess.revokeAccess(contractA, user2, { from: deployer });
        expectEvent(tx, 'AccessRevoked', {
          contractAddress: contractA,
          callerAddress: user2
        });
      });
    });
  });

  describe("Self Access Management", () => {
    beforeEach(async () => {
      // Grant contractA permission to manage its own access
      await masterAccess.grantAccess(masterAccess.address, contractA, { from: deployer });
    });

    describe("grantSelfAccess", () => {
      it("should allow contract to grant access to itself", async () => {
        const tx = await masterAccess.grantSelfAccess(user1, { from: contractA });
        
        expectEvent(tx, 'AccessGranted', {
          contractAddress: contractA,
          caller: user1
        });

        const hasAccess = await masterAccess.hasAccess(contractA, user1);
        assert.equal(hasAccess, true, "User1 should have access to contractA");
      });

      it("should allow any caller to grant self access", async () => {
        // grantSelfAccess doesn't check authorization - it allows any contract to grant access to itself
        const tx = await masterAccess.grantSelfAccess(user1, { from: unauthorized });
        expectEvent(tx, 'AccessGranted', {
          contractAddress: unauthorized,
          caller: user1
        });
      });
    });

    describe("revokeSelfAccess", () => {
      beforeEach(async () => {
        await masterAccess.grantSelfAccess(user1, { from: contractA });
      });

      it("should allow contract to revoke access to itself", async () => {
        const tx = await masterAccess.revokeSelfAccess(user1, { from: contractA });
        
        expectEvent(tx, 'AccessRevoked', {
          contractAddress: contractA,
          caller: user1
        });

        const hasAccess = await masterAccess.hasAccess(contractA, user1);
        assert.equal(hasAccess, false, "User1 should not have access to contractA");
      });

      it("should allow any caller to revoke self access", async () => {
        // revokeSelfAccess doesn't check authorization - it allows any contract to revoke access from itself
        const tx = await masterAccess.revokeSelfAccess(user1, { from: unauthorized });
        expectEvent(tx, 'AccessRevoked', {
          contractAddress: unauthorized,
          caller: user1
        });
      });
    });
  });

  describe("Access Checking", () => {
    beforeEach(async () => {
      await masterAccess.grantAccess(contractA, user1, { from: deployer });
      await masterAccess.grantAccess(masterAccess.address, contractB, { from: deployer });
      await masterAccess.grantSelfAccess(user2, { from: contractB });
    });

    describe("hasAccess", () => {
      it("should return true for granted access", async () => {
        const hasAccess = await masterAccess.hasAccess(contractA, user1);
        assert.equal(hasAccess, true, "Should return true for granted access");
      });

      it("should return false for non-granted access", async () => {
        const hasAccess = await masterAccess.hasAccess(contractA, user2);
        assert.equal(hasAccess, false, "Should return false for non-granted access");
      });

      it("should return true for self-granted access", async () => {
        const hasAccess = await masterAccess.hasAccess(contractB, user2);
        assert.equal(hasAccess, true, "Should return true for self-granted access");
      });
    });

    describe("selfCheckAccess", () => {
      it("should return true when caller has access", async () => {
        // selfCheckAccess should be called by a contract to check if an address has access to it
        // Simulate contractA checking if user1 has access
        const hasAccess = await masterAccess.selfCheckAccess(user1, { from: contractA });
        assert.equal(hasAccess, true, "Should return true when caller has access");
      });

      it("should return false when caller doesn't have access", async () => {
        // Simulate contractA checking if user2 has access (user2 was not granted access)
        const hasAccess = await masterAccess.selfCheckAccess(user2, { from: contractA });
        assert.equal(hasAccess, false, "Should return false when caller doesn't have access");
      });
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle multiple contracts and users", async () => {
      // Grant various permissions
      await masterAccess.grantAccess(contractA, user1, { from: deployer });
      await masterAccess.grantAccess(contractA, user2, { from: deployer });
      await masterAccess.grantAccess(contractB, user1, { from: deployer });
      
      // Check all permissions
      assert.equal(await masterAccess.hasAccess(contractA, user1), true);
      assert.equal(await masterAccess.hasAccess(contractA, user2), true);
      assert.equal(await masterAccess.hasAccess(contractB, user1), true);
      assert.equal(await masterAccess.hasAccess(contractB, user2), false);
      
      // Revoke one permission
      await masterAccess.revokeAccess(contractA, user1, { from: deployer });
      
      // Verify only that permission was revoked
      assert.equal(await masterAccess.hasAccess(contractA, user1), false);
      assert.equal(await masterAccess.hasAccess(contractA, user2), true);
      assert.equal(await masterAccess.hasAccess(contractB, user1), true);
    });

    it("should maintain separate permissions for direct and self access", async () => {
      // Grant contractA ability to manage its own access
      await masterAccess.grantAccess(masterAccess.address, contractA, { from: deployer });
      
      // Grant direct access to user1 for contractA
      await masterAccess.grantAccess(contractA, user1, { from: deployer });
      
      // ContractA grants self access to user2
      await masterAccess.grantSelfAccess(user2, { from: contractA });
      
      // Both should have access
      assert.equal(await masterAccess.hasAccess(contractA, user1), true);
      assert.equal(await masterAccess.hasAccess(contractA, user2), true);
      
      // Revoke direct access management from contractA
      await masterAccess.revokeAccess(masterAccess.address, contractA, { from: deployer });
      
      // contractA can still grant self access (grantSelfAccess doesn't check authorization)
      const tx = await masterAccess.grantSelfAccess(unauthorized, { from: contractA });
      expectEvent(tx, 'AccessGranted', {
        contractAddress: contractA,
        caller: unauthorized
      });
      
      // But existing permissions should remain
      assert.equal(await masterAccess.hasAccess(contractA, user1), true);
      assert.equal(await masterAccess.hasAccess(contractA, user2), true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero address inputs", async () => {
      await expectRevert(
        masterAccess.grantAccess("0x0000000000000000000000000000000000000000", user1, { from: deployer }),
        "MasterAccessControl: Invalid contract address"
      );

      await expectRevert(
        masterAccess.grantAccess(contractA, "0x0000000000000000000000000000000000000000", { from: deployer }),
        "MasterAccessControl: Invalid caller address"
      );
    });

    it("should allow deployer to revoke their own access to MasterAccessControl", async () => {
      // The contract doesn't prevent this, so it should succeed
      const tx = await masterAccess.revokeAccess(masterAccess.address, deployer, { from: deployer });
      
      expectEvent(tx, 'AccessRevoked', {
        contractAddress: masterAccess.address,
        caller: deployer
      });
      
      // Deployer should no longer have access
      const hasAccess = await masterAccess.hasAccess(masterAccess.address, deployer);
      assert.equal(hasAccess, false, "Deployer should no longer have access");
    });
  });
});