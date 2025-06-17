const NFTAccessControl = artifacts.require("NFTAccessControl");
const MasterAccessControl = artifacts.require("MasterAccessControl");
const AIServiceAgreementManagement = artifacts.require("AIServiceAgreementManagement");
const { expectRevert, expectEvent, time } = require('@openzeppelin/test-helpers');

contract("NFTAccessControl", (accounts) => {
  const [deployer, nftContract, user1, user2, user3, unauthorized] = accounts;
  let nftAccess, masterAccess, aiServiceAgreement;
  
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
    masterAccess = await MasterAccessControl.new({ from: deployer });
    nftAccess = await NFTAccessControl.new(masterAccess.address, { from: deployer });
    
    // Grant NFTContract permission to use NFTAccessControl
    await masterAccess.grantAccess(nftAccess.address, nftContract, { from: deployer });
  });

  describe("Deployment", () => {
    it("should set correct initial values", async () => {
      const masterAccessAddr = await nftAccess.masterAccessControl();
      assert.equal(masterAccessAddr, masterAccess.address, "MasterAccessControl address should be set");
      
      const aiServiceAddr = await nftAccess.aiServiceAgreementManagement();
      assert.equal(aiServiceAddr, "0x0000000000000000000000000000000000000000", "AIServiceAgreement should be zero initially");
    });
  });

  describe("Access Level Management", () => {
    const tokenId = 1;

    describe("grantAccess", () => {
      it("should grant access with valid access level", async () => {
        const tx = await nftAccess.grantAccess(tokenId, user1, AccessLevel.UseModel, { from: nftContract });
        
        expectEvent(tx, 'AccessChanged', {
          tokenId: tokenId.toString(),
          user: user1,
          newAccessLevel: AccessLevel.UseModel.toString()
        });

        const accessLevel = await nftAccess.getUserAccessLevel(tokenId, user1);
        assert.equal(accessLevel, AccessLevel.UseModel, "Access level should be set correctly");
      });

      it("should prevent granting access with invalid level", async () => {
        await expectRevert(
          nftAccess.grantAccess(tokenId, user1, 7, { from: nftContract }),
          "Invalid access level"
        );
      });

      it("should prevent unauthorized caller from granting access", async () => {
        await expectRevert(
          nftAccess.grantAccess(tokenId, user1, AccessLevel.UseModel, { from: unauthorized }),
          "Unauthorized: Caller is not authorized"
        );
      });

      it("should update existing access level", async () => {
        await nftAccess.grantAccess(tokenId, user1, AccessLevel.UseModel, { from: nftContract });
        await nftAccess.grantAccess(tokenId, user1, AccessLevel.EditData, { from: nftContract });
        
        const accessLevel = await nftAccess.getUserAccessLevel(tokenId, user1);
        assert.equal(accessLevel, AccessLevel.EditData, "Access level should be updated");
      });

      it("should not exceed maximum access level if set", async () => {
        await nftAccess.setMaximumAccessLevel(tokenId, AccessLevel.ViewAndDownload, { from: nftContract });
        
        await expectRevert(
          nftAccess.grantAccess(tokenId, user1, AccessLevel.EditData, { from: nftContract }),
          "Access level exceeds maximum allowed"
        );
      });
    });

    describe("revokeAccess", () => {
      beforeEach(async () => {
        await nftAccess.grantAccess(tokenId, user1, AccessLevel.EditData, { from: nftContract });
      });

      it("should revoke access when no protection exists", async () => {
        const tx = await nftAccess.revokeAccess(tokenId, user1, { from: nftContract });
        
        expectEvent(tx, 'AccessRevoked', {
          tokenId: tokenId.toString(),
          user: user1
        });

        const accessLevel = await nftAccess.getUserAccessLevel(tokenId, user1);
        assert.equal(accessLevel, AccessLevel.None, "Access should be revoked");
      });

      it("should prevent revoking protected access", async () => {
        // Deploy AIServiceAgreement and set it
        aiServiceAgreement = await AIServiceAgreementManagement.new(
          masterAccess.address,
          nftAccess.address,
          { from: deployer }
        );
        await nftAccess.setAIServiceAgreementManagement(aiServiceAgreement.address, { from: deployer });
        await masterAccess.grantAccess(aiServiceAgreement.address, nftContract, { from: deployer });
        
        // Record an access sale
        await aiServiceAgreement.recordAccessSale(tokenId, user1, 3600, { from: nftContract });
        
        await expectRevert(
          nftAccess.revokeAccess(tokenId, user1, { from: nftContract }),
          "User has paid access that cannot be revoked"
        );
      });

      it("should prevent unauthorized caller from revoking access", async () => {
        await expectRevert(
          nftAccess.revokeAccess(tokenId, user1, { from: unauthorized }),
          "Unauthorized: Caller is not authorized"
        );
      });
    });

    describe("resetAccess", () => {
      beforeEach(async () => {
        await nftAccess.grantAccess(tokenId, user1, AccessLevel.EditData, { from: nftContract });
        await nftAccess.grantAccess(tokenId, user2, AccessLevel.UseModel, { from: nftContract });
        await nftAccess.grantAccess(tokenId, user3, AccessLevel.ViewAndDownload, { from: nftContract });
      });

      it("should reset all access for a token", async () => {
        const tx = await nftAccess.resetAccess(tokenId, { from: nftContract });
        
        expectEvent(tx, 'AccessReset', {
          tokenId: tokenId.toString()
        });

        // Check all users have no access
        assert.equal(await nftAccess.getUserAccessLevel(tokenId, user1), AccessLevel.None);
        assert.equal(await nftAccess.getUserAccessLevel(tokenId, user2), AccessLevel.None);
        assert.equal(await nftAccess.getUserAccessLevel(tokenId, user3), AccessLevel.None);
        
        // Check arrays are empty
        const usersWithAccess = await nftAccess.getAllUsersAccessForNFT(tokenId);
        assert.equal(usersWithAccess.length, 0, "No users should have access");
      });

      it("should prevent resetting with protected access", async () => {
        // Set up AIServiceAgreement
        aiServiceAgreement = await AIServiceAgreementManagement.new(
          masterAccess.address,
          nftAccess.address,
          { from: deployer }
        );
        await nftAccess.setAIServiceAgreementManagement(aiServiceAgreement.address, { from: deployer });
        await masterAccess.grantAccess(aiServiceAgreement.address, nftContract, { from: deployer });
        
        // Record an access sale for user1
        await aiServiceAgreement.recordAccessSale(tokenId, user1, 3600, { from: nftContract });
        
        await expectRevert(
          nftAccess.resetAccess(tokenId, { from: nftContract }),
          "Cannot reset: Users have paid access"
        );
      });
    });
  });

  describe("Access Level Queries", () => {
    const tokenId = 1;

    beforeEach(async () => {
      await nftAccess.grantAccess(tokenId, user1, AccessLevel.EditData, { from: nftContract });
      await nftAccess.grantAccess(tokenId, user2, AccessLevel.UseModel, { from: nftContract });
      await nftAccess.setDefaultAccessLevel(tokenId, AccessLevel.ViewAndDownload, { from: nftContract });
    });

    describe("checkMinimumAccess", () => {
      it("should return true when user has exact required access", async () => {
        const hasAccess = await nftAccess.checkMinimumAccess(tokenId, user1, AccessLevel.EditData);
        assert.equal(hasAccess, true, "Should have required access");
      });

      it("should return true when user has higher access", async () => {
        const hasAccess = await nftAccess.checkMinimumAccess(tokenId, user1, AccessLevel.UseModel);
        assert.equal(hasAccess, true, "Should have access with higher level");
      });

      it("should return false when user has lower access", async () => {
        const hasAccess = await nftAccess.checkMinimumAccess(tokenId, user2, AccessLevel.EditData);
        assert.equal(hasAccess, false, "Should not have access with lower level");
      });

      it("should use default access level when user has no specific access", async () => {
        const hasAccess = await nftAccess.checkMinimumAccess(tokenId, user3, AccessLevel.ViewAndDownload);
        assert.equal(hasAccess, true, "Should have default access level");
      });
    });

    describe("getHighestAccess", () => {
      it("should return user's specific access when higher than default", async () => {
        const access = await nftAccess.getHighestAccess(tokenId, user1);
        assert.equal(access, AccessLevel.EditData, "Should return user's specific access");
      });

      it("should return default access when higher than user's specific access", async () => {
        const access = await nftAccess.getHighestAccess(tokenId, user2);
        assert.equal(access, AccessLevel.ViewAndDownload, "Should return default access");
      });

      it("should return default access for user with no specific access", async () => {
        const access = await nftAccess.getHighestAccess(tokenId, user3);
        assert.equal(access, AccessLevel.ViewAndDownload, "Should return default access");
      });
    });

    describe("transferAccess", () => {
      it("should transfer all access rights from one user to another", async () => {
        // Grant multiple tokens access to user1
        await nftAccess.grantAccess(2, user1, AccessLevel.Resale, { from: nftContract });
        await nftAccess.grantAccess(3, user1, AccessLevel.CreateReplica, { from: nftContract });
        
        // Transfer all access from user1 to user3
        await nftAccess.transferAccess(user1, user3, { from: nftContract });
        
        // Check user1 has no access
        assert.equal(await nftAccess.getUserAccessLevel(tokenId, user1), AccessLevel.None);
        assert.equal(await nftAccess.getUserAccessLevel(2, user1), AccessLevel.None);
        assert.equal(await nftAccess.getUserAccessLevel(3, user1), AccessLevel.None);
        
        // Check user3 has all the access
        assert.equal(await nftAccess.getUserAccessLevel(tokenId, user3), AccessLevel.EditData);
        assert.equal(await nftAccess.getUserAccessLevel(2, user3), AccessLevel.Resale);
        assert.equal(await nftAccess.getUserAccessLevel(3, user3), AccessLevel.CreateReplica);
      });

      it("should handle transfer when target user already has some access", async () => {
        await nftAccess.grantAccess(tokenId, user3, AccessLevel.UseModel, { from: nftContract });
        await nftAccess.grantAccess(2, user3, AccessLevel.AbsoluteOwnership, { from: nftContract });
        
        await nftAccess.transferAccess(user1, user3, { from: nftContract });
        
        // User3 should have the higher access level for tokenId
        assert.equal(await nftAccess.getUserAccessLevel(tokenId, user3), AccessLevel.EditData);
        // User3 should keep absolute ownership for token 2
        assert.equal(await nftAccess.getUserAccessLevel(2, user3), AccessLevel.AbsoluteOwnership);
      });
    });
  });

  describe("Default and Maximum Access Levels", () => {
    const tokenId = 1;

    describe("setDefaultAccessLevel", () => {
      it("should set default access level", async () => {
        await nftAccess.setDefaultAccessLevel(tokenId, AccessLevel.UseModel, { from: nftContract });
        
        const defaultLevel = await nftAccess.defaultAccessLevel(tokenId);
        assert.equal(defaultLevel, AccessLevel.UseModel, "Default access level should be set");
      });

      it("should prevent setting invalid default access level", async () => {
        await expectRevert(
          nftAccess.setDefaultAccessLevel(tokenId, 7, { from: nftContract }),
          "Invalid access level"
        );
      });

      it("should not allow default level to exceed maximum if set", async () => {
        await nftAccess.setMaximumAccessLevel(tokenId, AccessLevel.ViewAndDownload, { from: nftContract });
        
        await expectRevert(
          nftAccess.setDefaultAccessLevel(tokenId, AccessLevel.EditData, { from: nftContract }),
          "Default level exceeds maximum allowed"
        );
      });
    });

    describe("setMaximumAccessLevel", () => {
      it("should set maximum access level", async () => {
        await nftAccess.setMaximumAccessLevel(tokenId, AccessLevel.ViewAndDownload, { from: nftContract });
        
        const maxLevel = await nftAccess.maximumAccessLevel(tokenId);
        assert.equal(maxLevel, AccessLevel.ViewAndDownload, "Maximum access level should be set");
      });

      it("should prevent setting invalid maximum access level", async () => {
        await expectRevert(
          nftAccess.setMaximumAccessLevel(tokenId, 7, { from: nftContract }),
          "Invalid access level"
        );
      });
    });
  });

  describe("Batch Operations", () => {
    describe("getAllAccessForUser", () => {
      beforeEach(async () => {
        await nftAccess.grantAccess(1, user1, AccessLevel.EditData, { from: nftContract });
        await nftAccess.grantAccess(2, user1, AccessLevel.UseModel, { from: nftContract });
        await nftAccess.grantAccess(3, user1, AccessLevel.ViewAndDownload, { from: nftContract });
        await nftAccess.grantAccess(2, user2, AccessLevel.Resale, { from: nftContract });
      });

      it("should return all token access for a user", async () => {
        const result = await nftAccess.getAllAccessForUser(user1);
        const tokenIds = result[0];
        const accessLevels = result[1];
        
        assert.equal(tokenIds.length, 3, "Should have 3 tokens");
        assert.equal(accessLevels.length, 3, "Should have 3 access levels");
        
        // Verify the data
        assert.equal(tokenIds[0], 1);
        assert.equal(accessLevels[0], AccessLevel.EditData);
        assert.equal(tokenIds[1], 2);
        assert.equal(accessLevels[1], AccessLevel.UseModel);
        assert.equal(tokenIds[2], 3);
        assert.equal(accessLevels[2], AccessLevel.ViewAndDownload);
      });

      it("should return empty arrays for user with no access", async () => {
        const result = await nftAccess.getAllAccessForUser(user3);
        assert.equal(result[0].length, 0, "Should have no tokens");
        assert.equal(result[1].length, 0, "Should have no access levels");
      });
    });

    describe("getAllUsersAccessForNFT", () => {
      const tokenId = 1;

      beforeEach(async () => {
        await nftAccess.grantAccess(tokenId, user1, AccessLevel.EditData, { from: nftContract });
        await nftAccess.grantAccess(tokenId, user2, AccessLevel.UseModel, { from: nftContract });
        await nftAccess.grantAccess(tokenId, user3, AccessLevel.ViewAndDownload, { from: nftContract });
      });

      it("should return all users with access to a token", async () => {
        const result = await nftAccess.getAllUsersAccessForNFT(tokenId);
        const users = result[0];
        const accessLevels = result[1];
        
        assert.equal(users.length, 3, "Should have 3 users");
        assert.equal(accessLevels.length, 3, "Should have 3 access levels");
        
        // Find and verify each user's access
        const user1Index = users.indexOf(user1);
        assert.notEqual(user1Index, -1, "User1 should be in list");
        assert.equal(accessLevels[user1Index], AccessLevel.EditData);
        
        const user2Index = users.indexOf(user2);
        assert.notEqual(user2Index, -1, "User2 should be in list");
        assert.equal(accessLevels[user2Index], AccessLevel.UseModel);
      });

      it("should return empty arrays for token with no access granted", async () => {
        const result = await nftAccess.getAllUsersAccessForNFT(999);
        assert.equal(result[0].length, 0, "Should have no users");
        assert.equal(result[1].length, 0, "Should have no access levels");
      });
    });
  });

  describe("AIServiceAgreementManagement Integration", () => {
    beforeEach(async () => {
      aiServiceAgreement = await AIServiceAgreementManagement.new(
        masterAccess.address,
        nftAccess.address,
        { from: deployer }
      );
      await nftAccess.setAIServiceAgreementManagement(aiServiceAgreement.address, { from: deployer });
    });

    it("should set AIServiceAgreementManagement address", async () => {
      const addr = await nftAccess.aiServiceAgreementManagement();
      assert.equal(addr, aiServiceAgreement.address, "AIServiceAgreement address should be set");
    });

    it("should only allow deployer to set AIServiceAgreementManagement", async () => {
      const newAiService = await AIServiceAgreementManagement.new(
        masterAccess.address,
        nftAccess.address,
        { from: deployer }
      );
      
      await expectRevert(
        nftAccess.setAIServiceAgreementManagement(newAiService.address, { from: unauthorized }),
        "Unauthorized: Only deployer can set"
      );
    });
  });

  describe("Edge Cases and Security", () => {
    it("should handle granting access to zero address", async () => {
      await expectRevert(
        nftAccess.grantAccess(1, "0x0000000000000000000000000000000000000000", AccessLevel.UseModel, { from: nftContract }),
        "Invalid user address"
      );
    });

    it("should handle very large token IDs", async () => {
      const largeTokenId = "115792089237316195423570985008687907853269984665640564039457584007913129639935"; // max uint256
      
      // Should not revert
      await nftAccess.grantAccess(largeTokenId, user1, AccessLevel.UseModel, { from: nftContract });
      
      const accessLevel = await nftAccess.getUserAccessLevel(largeTokenId, user1);
      assert.equal(accessLevel, AccessLevel.UseModel, "Should handle large token IDs");
    });

    it("should maintain data integrity after multiple operations", async () => {
      // Grant access to multiple users for multiple tokens
      for (let token = 1; token <= 3; token++) {
        await nftAccess.grantAccess(token, user1, AccessLevel.UseModel, { from: nftContract });
        await nftAccess.grantAccess(token, user2, AccessLevel.EditData, { from: nftContract });
      }
      
      // Revoke some access
      await nftAccess.revokeAccess(2, user1, { from: nftContract });
      
      // Transfer user2's access to user3
      await nftAccess.transferAccess(user2, user3, { from: nftContract });
      
      // Verify final state
      assert.equal(await nftAccess.getUserAccessLevel(1, user1), AccessLevel.UseModel);
      assert.equal(await nftAccess.getUserAccessLevel(2, user1), AccessLevel.None);
      assert.equal(await nftAccess.getUserAccessLevel(3, user1), AccessLevel.UseModel);
      
      assert.equal(await nftAccess.getUserAccessLevel(1, user2), AccessLevel.None);
      assert.equal(await nftAccess.getUserAccessLevel(2, user2), AccessLevel.None);
      assert.equal(await nftAccess.getUserAccessLevel(3, user2), AccessLevel.None);
      
      assert.equal(await nftAccess.getUserAccessLevel(1, user3), AccessLevel.EditData);
      assert.equal(await nftAccess.getUserAccessLevel(2, user3), AccessLevel.EditData);
      assert.equal(await nftAccess.getUserAccessLevel(3, user3), AccessLevel.EditData);
    });
  });
});