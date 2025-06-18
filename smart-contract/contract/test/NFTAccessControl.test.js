const NFTAccessControl = artifacts.require("NFTAccessControl");
const MasterAccessControl = artifacts.require("MasterAccessControl");
const AIServiceAgreementManagement = artifacts.require("AIServiceAgreementManagement");
const { expectRevert, expectEvent, time } = require('@openzeppelin/test-helpers');
const { delay } = require('./helpers/test-utils');

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
    
    // Add delay to handle nonce synchronization
    await delay(200);
  });

  describe("Deployment", () => {
    it("should set correct initial values", async () => {
      const masterAccessAddr = await nftAccess.accessControl();
      assert.equal(masterAccessAddr, masterAccess.address, "MasterAccessControl address should be set");
      
      const aiServiceAddr = await nftAccess.aiServiceAgreementManagement();
      assert.equal(aiServiceAddr, "0x0000000000000000000000000000000000000000", "AIServiceAgreement should be zero initially");
    });
  });

  describe("Access Level Management", () => {
    const tokenId = 1;

    describe("grantAccess", () => {
      it("should grant access with valid access level", async () => {
        // First set max access level
        await nftAccess.setMaxAccessLevel(tokenId, AccessLevel.AbsoluteOwnership, { from: nftContract });
        
        const tx = await nftAccess.grantAccess(tokenId, user1, AccessLevel.UseModel, { from: nftContract });
        
        expectEvent(tx, 'AccessGranted', {
          nftId: tokenId.toString(),
          user: user1,
          accessLevel: AccessLevel.UseModel.toString()
        });

        expectEvent(tx, 'AccessLevelChanged', {
          user: user1,
          nftId: tokenId.toString(),
          newAccessLevel: AccessLevel.UseModel.toString()
        });

        const accessLevel = await nftAccess.getAccessLevel(tokenId, user1);
        assert.equal(accessLevel, AccessLevel.UseModel, "Access level should be set correctly");
      });

      it("should prevent granting access with invalid level", async () => {
        await expectRevert(
          nftAccess.grantAccess(tokenId, user1, AccessLevel.None, { from: nftContract }),
          "NFTAccessControl: Invalid access level"
        );
      });

      it("should prevent unauthorized caller from granting access", async () => {
        await expectRevert(
          nftAccess.grantAccess(tokenId, user1, AccessLevel.UseModel, { from: unauthorized }),
          "NFTAccessControl: Caller not authorized"
        );
      });

      it("should update existing access level", async () => {
        // First set max access level
        await nftAccess.setMaxAccessLevel(tokenId, AccessLevel.AbsoluteOwnership, { from: nftContract });
        await delay(100);
        
        await nftAccess.grantAccess(tokenId, user1, AccessLevel.UseModel, { from: nftContract });
        await delay(100);
        await nftAccess.grantAccess(tokenId, user1, AccessLevel.EditData, { from: nftContract });
        
        const accessLevel = await nftAccess.getAccessLevel(tokenId, user1);
        assert.equal(accessLevel, AccessLevel.EditData, "Access level should be updated");
      });

      it("should not exceed maximum access level if set", async () => {
        await nftAccess.setMaxAccessLevel(tokenId, AccessLevel.ViewAndDownload, { from: nftContract });
        await delay(100);
        
        await expectRevert(
          nftAccess.grantAccess(tokenId, user1, AccessLevel.EditData, { from: nftContract }),
          "NFTAccessControl: Exceeds max access level"
        );
      });
    });

    describe("revokeAccess", () => {
      beforeEach(async () => {
        // Set max access level first
        await nftAccess.setMaxAccessLevel(tokenId, AccessLevel.AbsoluteOwnership, { from: nftContract });
        await delay(100);
        await nftAccess.grantAccess(tokenId, user1, AccessLevel.EditData, { from: nftContract });
        await delay(100);
      });

      it("should revoke access when no protection exists", async () => {
        const tx = await nftAccess.revokeAccess(tokenId, user1, { from: nftContract });
        
        expectEvent(tx, 'AccessRevoked', {
          nftId: tokenId.toString(),
          user: user1
        });

        expectEvent(tx, 'AccessLevelChanged', {
          user: user1,
          nftId: tokenId.toString(),
          newAccessLevel: AccessLevel.None.toString()
        });

        const accessLevel = await nftAccess.getAccessLevel(tokenId, user1);
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
        
        // Record an access sale with proper parameters: _nftId, _user, _amount, _duration, _level
        await aiServiceAgreement.recordAccessSale(tokenId, user1, web3.utils.toWei('1', 'ether'), 3600, AccessLevel.EditData, { from: nftContract });
        
        await expectRevert(
          nftAccess.revokeAccess(tokenId, user1, { from: nftContract }),
          "NFTAccessControl: Cannot revoke paid access"
        );
      });

      it("should prevent unauthorized caller from revoking access", async () => {
        await expectRevert(
          nftAccess.revokeAccess(tokenId, user1, { from: unauthorized }),
          "NFTAccessControl: Caller not authorized"
        );
      });
    });
  });

  describe("Access Level Queries", () => {
    const tokenId = 1;

    beforeEach(async () => {
      // Set max access level first
      await nftAccess.setMaxAccessLevel(tokenId, AccessLevel.AbsoluteOwnership, { from: nftContract });
      await delay(100);
      await nftAccess.grantAccess(tokenId, user1, AccessLevel.EditData, { from: nftContract });
      await delay(100);
      await nftAccess.grantAccess(tokenId, user2, AccessLevel.UseModel, { from: nftContract });
      await delay(100);
      await nftAccess.setDefaultAccessLevel(tokenId, AccessLevel.ViewAndDownload, { from: nftContract });
      await delay(100);
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
  });

  describe("Default and Maximum Access Levels", () => {
    const tokenId = 1;

    describe("setDefaultAccessLevel", () => {
      it("should set default access level", async () => {
        // First set max access level
        await nftAccess.setMaxAccessLevel(tokenId, AccessLevel.AbsoluteOwnership, { from: nftContract });
        await delay(100);
        
        await nftAccess.setDefaultAccessLevel(tokenId, AccessLevel.UseModel, { from: nftContract });
        
        const defaultLevel = await nftAccess.defaultAccessLevel(tokenId);
        assert.equal(defaultLevel, AccessLevel.UseModel, "Default access level should be set");
      });

      it("should prevent setting default access level higher than max", async () => {
        // First set a low max access level
        await nftAccess.setMaxAccessLevel(tokenId, AccessLevel.UseModel, { from: nftContract });
        await delay(100);
        
        await expectRevert(
          nftAccess.setDefaultAccessLevel(tokenId, AccessLevel.EditData, { from: nftContract }),
          "NFTAccessControl: Exceeds max access level"
        );
      });

      it("should allow setting default level when within max level", async () => {
        await nftAccess.setMaxAccessLevel(tokenId, AccessLevel.ViewAndDownload, { from: nftContract });
        await delay(100);
        
        // This should succeed
        await nftAccess.setDefaultAccessLevel(tokenId, AccessLevel.UseModel, { from: nftContract });
        
        const defaultLevel = await nftAccess.defaultAccessLevel(tokenId);
        assert.equal(defaultLevel, AccessLevel.UseModel, "Default level should be set");
      });
    });

    describe("setMaxAccessLevel", () => {
      it("should set maximum access level", async () => {
        await nftAccess.setMaxAccessLevel(tokenId, AccessLevel.ViewAndDownload, { from: nftContract });
        
        const maxLevel = await nftAccess.maxAccessLevel(tokenId);
        assert.equal(maxLevel, AccessLevel.ViewAndDownload, "Maximum access level should be set");
      });

      it("should prevent setting invalid maximum access level", async () => {
        await expectRevert(
          nftAccess.setMaxAccessLevel(tokenId, AccessLevel.None, { from: nftContract }),
          "NFTAccessControl: Invalid access level"
        );
      });
    });
  });

  describe("Batch Operations", () => {
    describe("getAllAccessForUser", () => {
      beforeEach(async () => {
        // Set max access levels first
        await nftAccess.setMaxAccessLevel(1, AccessLevel.AbsoluteOwnership, { from: nftContract });
        await delay(100);
        await nftAccess.setMaxAccessLevel(2, AccessLevel.AbsoluteOwnership, { from: nftContract });
        await delay(100);
        await nftAccess.setMaxAccessLevel(3, AccessLevel.AbsoluteOwnership, { from: nftContract });
        await delay(100);
        
        await nftAccess.grantAccess(1, user1, AccessLevel.EditData, { from: nftContract });
        await delay(100);
        await nftAccess.grantAccess(2, user1, AccessLevel.UseModel, { from: nftContract });
        await delay(100);
        await nftAccess.grantAccess(3, user1, AccessLevel.ViewAndDownload, { from: nftContract });
        await delay(100);
        await nftAccess.grantAccess(2, user2, AccessLevel.Resale, { from: nftContract });
        await delay(100);
      });

      it("should return all token access for a user", async () => {
        const result = await nftAccess.getAllAccessForUser(user1);
        
        assert.equal(result.length, 3, "Should have 3 entries");
        
        // The contract returns an array of AccessEntry structs
        // Verify the data
        assert.equal(result[0].nftId, 1);
        assert.equal(result[0].accessLevel, AccessLevel.EditData);
        assert.equal(result[1].nftId, 2);
        assert.equal(result[1].accessLevel, AccessLevel.UseModel);
        assert.equal(result[2].nftId, 3);
        assert.equal(result[2].accessLevel, AccessLevel.ViewAndDownload);
      });

      it("should return empty array for user with no access", async () => {
        const result = await nftAccess.getAllAccessForUser(user3);
        assert.equal(result.length, 0, "Should have no entries");
      });
    });

    describe("getAllUsersAccessForNFT", () => {
      const tokenId = 1;

      beforeEach(async () => {
        // Set max access level first
        await nftAccess.setMaxAccessLevel(tokenId, AccessLevel.AbsoluteOwnership, { from: nftContract });
        await delay(100);
        
        await nftAccess.grantAccess(tokenId, user1, AccessLevel.EditData, { from: nftContract });
        await delay(100);
        await nftAccess.grantAccess(tokenId, user2, AccessLevel.UseModel, { from: nftContract });
        await delay(100);
        await nftAccess.grantAccess(tokenId, user3, AccessLevel.ViewAndDownload, { from: nftContract });
        await delay(100);
      });

      it("should return all users with access to a token", async () => {
        const result = await nftAccess.getAllUsersAccessForNFT(tokenId);
        
        assert.equal(result.length, 3, "Should have 3 users");
        
        // The contract returns an array of UserAccess structs
        // Find and verify each user's access
        const user1Entry = result.find(entry => entry.user === user1);
        assert(user1Entry, "User1 should be in list");
        assert.equal(user1Entry.accessLevel, AccessLevel.EditData);
        
        const user2Entry = result.find(entry => entry.user === user2);
        assert(user2Entry, "User2 should be in list");
        assert.equal(user2Entry.accessLevel, AccessLevel.UseModel);
      });

      it("should return empty array for token with no access granted", async () => {
        const result = await nftAccess.getAllUsersAccessForNFT(999);
        assert.equal(result.length, 0, "Should have no users");
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

    it("should only allow authorized to set AIServiceAgreementManagement", async () => {
      const newAiService = await AIServiceAgreementManagement.new(
        masterAccess.address,
        nftAccess.address,
        { from: deployer }
      );
      
      await expectRevert(
        nftAccess.setAIServiceAgreementManagement(newAiService.address, { from: unauthorized }),
        "NFTAccessControl: Caller not authorized"
      );
    });
  });

  describe("Edge Cases and Security", () => {
    it("should handle granting access to zero address", async () => {
      await expectRevert(
        nftAccess.grantAccess(1, "0x0000000000000000000000000000000000000000", AccessLevel.UseModel, { from: nftContract }),
        "NFTAccessControl: Invalid user address"
      );
    });

    it("should handle very large token IDs", async () => {
      const largeTokenId = "115792089237316195423570985008687907853269984665640564039457584007913129639935"; // max uint256
      
      // Set max access level first
      await nftAccess.setMaxAccessLevel(largeTokenId, AccessLevel.AbsoluteOwnership, { from: nftContract });
      await delay(100);
      
      // Should not revert
      await nftAccess.grantAccess(largeTokenId, user1, AccessLevel.UseModel, { from: nftContract });
      
      const accessLevel = await nftAccess.getAccessLevel(largeTokenId, user1);
      assert.equal(accessLevel, AccessLevel.UseModel, "Should handle large token IDs");
    });

    it("should maintain data integrity after multiple operations", async () => {
      // Set max access levels first
      for (let token = 1; token <= 3; token++) {
        await nftAccess.setMaxAccessLevel(token, AccessLevel.AbsoluteOwnership, { from: nftContract });
        await delay(100);
      }
      
      // Grant access to multiple users for multiple tokens
      for (let token = 1; token <= 3; token++) {
        await nftAccess.grantAccess(token, user1, AccessLevel.UseModel, { from: nftContract });
        await delay(100);
        await nftAccess.grantAccess(token, user2, AccessLevel.EditData, { from: nftContract });
        await delay(100);
      }
      
      // Revoke some access
      await nftAccess.revokeAccess(2, user1, { from: nftContract });
      await delay(100);
      
      // Verify final state
      assert.equal(await nftAccess.getAccessLevel(1, user1), AccessLevel.UseModel);
      assert.equal(await nftAccess.getAccessLevel(2, user1), AccessLevel.None);
      assert.equal(await nftAccess.getAccessLevel(3, user1), AccessLevel.UseModel);
      
      assert.equal(await nftAccess.getAccessLevel(1, user2), AccessLevel.EditData);
      assert.equal(await nftAccess.getAccessLevel(2, user2), AccessLevel.EditData);
      assert.equal(await nftAccess.getAccessLevel(3, user2), AccessLevel.EditData);
    });
  });
});