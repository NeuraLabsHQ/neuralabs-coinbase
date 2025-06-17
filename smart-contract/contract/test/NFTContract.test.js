const NFTContract = artifacts.require("NFTContract");
const MasterAccessControl = artifacts.require("MasterAccessControl");
const NFTAccessControl = artifacts.require("NFTAccessControl");
const NFTMetadata = artifacts.require("NFTMetadata");
const Monetization = artifacts.require("Monetization");
const AIServiceAgreementManagement = artifacts.require("AIServiceAgreementManagement");
const { expectRevert, expectEvent, time } = require('@openzeppelin/test-helpers');

contract("NFTContract", (accounts) => {
  const [deployer, user1, user2, user3, unauthorized] = accounts;
  let nftContract, masterAccess, nftAccess, nftMetadata, monetization, aiServiceAgreement;
  
  // Lock statuses
  const LockStatus = {
    Locked: 0,
    Unlocking: 1,
    CanBeUnlocked: 2,
    Unlocked: 3
  };

  // Ownership levels
  const OwnershipLevel = {
    Level1: 1,
    Level2: 2,
    Level3: 3,
    Level4: 4,
    Level5: 5,
    Level6: 6
  };

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

  beforeEach(async () => {
    // Deploy all contracts
    masterAccess = await MasterAccessControl.new({ from: deployer });
    nftAccess = await NFTAccessControl.new(masterAccess.address, { from: deployer });
    nftMetadata = await NFTMetadata.new(masterAccess.address, nftAccess.address, { from: deployer });
    
    // Deploy NFTContract without monetization initially
    nftContract = await NFTContract.new(
      masterAccess.address,
      nftAccess.address,
      nftMetadata.address,
      "0x0000000000000000000000000000000000000000",
      { from: deployer }
    );

    // Deploy AIServiceAgreement
    aiServiceAgreement = await AIServiceAgreementManagement.new(
      masterAccess.address,
      nftAccess.address,
      { from: deployer }
    );

    // Deploy Monetization
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
    
    // Set monetization contract in NFTContract
    await nftContract.setMonetizationContract(monetization.address, { from: deployer });
    
    // Set AIServiceAgreement in NFTAccessControl
    await nftAccess.setAIServiceAgreementManagement(aiServiceAgreement.address, { from: deployer });
  });

  describe("Deployment", () => {
    it("should set correct initial values", async () => {
      assert.equal(await nftContract.name(), "NeuraLabs NFT", "Name should be set");
      assert.equal(await nftContract.symbol(), "NRNFT", "Symbol should be set");
      assert.equal(await nftContract.masterAccessControl(), masterAccess.address, "MasterAccessControl should be set");
      assert.equal(await nftContract.nftAccessControl(), nftAccess.address, "NFTAccessControl should be set");
      assert.equal(await nftContract.nftMetadata(), nftMetadata.address, "NFTMetadata should be set");
      assert.equal(await nftContract.monetizationContract(), monetization.address, "Monetization should be set");
    });
  });

  describe("NFT Creation", () => {
    describe("createNFT", () => {
      it("should create NFT with valid parameters", async () => {
        const tx = await nftContract.createNFT(
          user1,
          OwnershipLevel.Level3,
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

        // Get token ID from event
        const transferEvent = tx.logs.find(log => log.event === 'Transfer');
        const tokenId = transferEvent.args.tokenId;

        // Check NFT was minted
        assert.equal(await nftContract.ownerOf(tokenId), user1, "User1 should own the NFT");
        assert.equal((await nftContract.nftOwnershipLevel(tokenId)).toNumber(), OwnershipLevel.Level3, "Ownership level should be set");
        assert.equal((await nftContract.lockStatus(tokenId)).toNumber(), LockStatus.Unlocked, "NFT should be unlocked initially");

        // Check metadata was created
        const metadata = await nftMetadata.getMetadata(tokenId);
        assert.equal(metadata.ipType, validMetadata.ipType, "IP type should be set");
        assert.equal(metadata.ipId, validMetadata.ipId, "IP ID should be set");

        // Check owner has absolute ownership access
        const accessLevel = await nftAccess.getUserAccessLevel(tokenId, user1);
        assert.equal(accessLevel.toNumber(), AccessLevel.AbsoluteOwnership, "Owner should have absolute ownership access");
      });

      it("should prevent creating NFT with invalid ownership level", async () => {
        await expectRevert(
          nftContract.createNFT(
            user1,
            0, // Invalid level
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
          ),
          "Invalid ownership level"
        );

        await expectRevert(
          nftContract.createNFT(
            user1,
            7, // Invalid level
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
          ),
          "Invalid ownership level"
        );
      });

      it("should prevent unauthorized user from creating NFT", async () => {
        await expectRevert(
          nftContract.createNFT(
            user1,
            OwnershipLevel.Level3,
            validMetadata.ipType,
            validMetadata.ipId,
            validMetadata.imageUrl,
            validMetadata.storageType,
            validMetadata.storageId,
            validMetadata.encrypted,
            validMetadata.encryptionId,
            validMetadata.md5Hash,
            validMetadata.version,
            { from: unauthorized }
          ),
          "Unauthorized: Caller is not authorized"
        );
      });

      it("should increment token ID counter correctly", async () => {
        // Create first NFT
        const tx1 = await nftContract.createNFT(
          user1,
          OwnershipLevel.Level1,
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

        // Create second NFT
        const tx2 = await nftContract.createNFT(
          user2,
          OwnershipLevel.Level2,
          validMetadata.ipType,
          "model-456",
          validMetadata.imageUrl,
          validMetadata.storageType,
          validMetadata.storageId,
          validMetadata.encrypted,
          validMetadata.encryptionId,
          validMetadata.md5Hash,
          validMetadata.version,
          { from: deployer }
        );

        const tokenId1 = tx1.logs.find(log => log.event === 'Transfer').args.tokenId;
        const tokenId2 = tx2.logs.find(log => log.event === 'Transfer').args.tokenId;

        assert.equal(tokenId2.toNumber(), tokenId1.toNumber() + 1, "Token IDs should increment");
      });
    });
  });

  describe("NFT Burning", () => {
    let tokenId;

    beforeEach(async () => {
      const tx = await nftContract.createNFT(
        user1,
        OwnershipLevel.Level3,
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

    describe("burnNFT", () => {
      it("should allow owner to burn their NFT", async () => {
        const tx = await nftContract.burnNFT(tokenId, { from: user1 });

        expectEvent(tx, 'Transfer', {
          from: user1,
          to: "0x0000000000000000000000000000000000000000",
          tokenId: tokenId
        });

        // Verify NFT is burned
        await expectRevert(
          nftContract.ownerOf(tokenId),
          "ERC721: owner query for nonexistent token"
        );

        // Verify metadata is deleted
        const metadata = await nftMetadata.getMetadata(tokenId);
        assert.equal(metadata.ipType, "", "Metadata should be deleted");

        // Verify access is reset
        const accessLevel = await nftAccess.getUserAccessLevel(tokenId, user1);
        assert.equal(accessLevel.toNumber(), AccessLevel.None, "Access should be reset");
      });

      it("should prevent non-owner from burning NFT", async () => {
        await expectRevert(
          nftContract.burnNFT(tokenId, { from: user2 }),
          "Only token owner can burn"
        );
      });

      it("should prevent burning locked NFT", async () => {
        // Lock the NFT
        await nftContract.lockNFT(tokenId, { from: user1 });

        await expectRevert(
          nftContract.burnNFT(tokenId, { from: user1 }),
          "Cannot burn locked NFT"
        );
      });

      it("should clean up all associated data on burn", async () => {
        // Grant additional access to other users
        await nftAccess.grantAccess(tokenId, user2, AccessLevel.UseModel, { from: nftContract.address });
        await nftAccess.grantAccess(tokenId, user3, AccessLevel.ViewAndDownload, { from: nftContract.address });

        // Burn the NFT
        await nftContract.burnNFT(tokenId, { from: user1 });

        // Verify all access is removed
        const user2Access = await nftAccess.getUserAccessLevel(tokenId, user2);
        const user3Access = await nftAccess.getUserAccessLevel(tokenId, user3);
        assert.equal(user2Access.toNumber(), AccessLevel.None, "User2 access should be reset");
        assert.equal(user3Access.toNumber(), AccessLevel.None, "User3 access should be reset");

        // Verify ownership level is reset
        const ownershipLevel = await nftContract.nftOwnershipLevel(tokenId);
        assert.equal(ownershipLevel.toNumber(), 0, "Ownership level should be reset");
      });
    });
  });

  describe("Lock/Unlock Mechanism", () => {
    let tokenId;

    beforeEach(async () => {
      const tx = await nftContract.createNFT(
        user1,
        OwnershipLevel.Level3,
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

    describe("lockNFT", () => {
      it("should lock an unlocked NFT", async () => {
        const tx = await nftContract.lockNFT(tokenId, { from: user1 });

        expectEvent(tx, 'NFTLocked', {
          tokenId: tokenId,
          owner: user1
        });

        const lockStatus = await nftContract.lockStatus(tokenId);
        assert.equal(lockStatus.toNumber(), LockStatus.Locked, "NFT should be locked");
      });

      it("should prevent non-owner from locking NFT", async () => {
        await expectRevert(
          nftContract.lockNFT(tokenId, { from: user2 }),
          "Only token owner can lock"
        );
      });

      it("should prevent locking already locked NFT", async () => {
        await nftContract.lockNFT(tokenId, { from: user1 });

        await expectRevert(
          nftContract.lockNFT(tokenId, { from: user1 }),
          "NFT must be unlocked"
        );
      });
    });

    describe("initiateUnlock", () => {
      beforeEach(async () => {
        await nftContract.lockNFT(tokenId, { from: user1 });
      });

      it("should initiate unlock process", async () => {
        const tx = await nftContract.initiateUnlock(tokenId, { from: user1 });

        expectEvent(tx, 'UnlockInitiated', {
          tokenId: tokenId,
          owner: user1
        });

        const lockStatus = await nftContract.lockStatus(tokenId);
        assert.equal(lockStatus.toNumber(), LockStatus.Unlocking, "NFT should be in unlocking state");

        const unlockTime = await nftContract.unlockTime(tokenId);
        assert.notEqual(unlockTime.toNumber(), 0, "Unlock time should be set");
      });

      it("should prevent non-owner from initiating unlock", async () => {
        await expectRevert(
          nftContract.initiateUnlock(tokenId, { from: user2 }),
          "Only token owner can initiate unlock"
        );
      });

      it("should prevent initiating unlock for non-locked NFT", async () => {
        await nftContract.initiateUnlock(tokenId, { from: user1 });
        
        await expectRevert(
          nftContract.initiateUnlock(tokenId, { from: user1 }),
          "NFT must be locked"
        );
      });
    });

    describe("completeUnlock", () => {
      beforeEach(async () => {
        await nftContract.lockNFT(tokenId, { from: user1 });
        await nftContract.initiateUnlock(tokenId, { from: user1 });
      });

      it("should complete unlock after waiting period", async () => {
        // Move time forward by 3 days
        await time.increase(time.duration.days(3));

        const tx = await nftContract.completeUnlock(tokenId, { from: user1 });

        expectEvent(tx, 'NFTUnlocked', {
          tokenId: tokenId,
          owner: user1
        });

        const lockStatus = await nftContract.lockStatus(tokenId);
        assert.equal(lockStatus.toNumber(), LockStatus.Unlocked, "NFT should be unlocked");

        const unlockTime = await nftContract.unlockTime(tokenId);
        assert.equal(unlockTime.toNumber(), 0, "Unlock time should be reset");
      });

      it("should prevent completing unlock before waiting period", async () => {
        // Only wait 1 day (need 3 days)
        await time.increase(time.duration.days(1));

        await expectRevert(
          nftContract.completeUnlock(tokenId, { from: user1 }),
          "Unlock period not elapsed"
        );
      });

      it("should prevent non-owner from completing unlock", async () => {
        await time.increase(time.duration.days(3));

        await expectRevert(
          nftContract.completeUnlock(tokenId, { from: user2 }),
          "Only token owner can complete unlock"
        );
      });

      it("should prevent completing unlock for NFT not in unlocking state", async () => {
        // Complete the unlock
        await time.increase(time.duration.days(3));
        await nftContract.completeUnlock(tokenId, { from: user1 });

        // Try to complete again
        await expectRevert(
          nftContract.completeUnlock(tokenId, { from: user1 }),
          "NFT must be in unlocking state"
        );
      });
    });

    describe("unlockNFT", () => {
      beforeEach(async () => {
        await nftContract.lockNFT(tokenId, { from: user1 });
      });

      it("should unlock NFT directly when called by monetization contract", async () => {
        // Grant monetization contract permission
        await masterAccess.grantAccess(nftContract.address, monetization.address, { from: deployer });

        const tx = await nftContract.unlockNFT(tokenId, { from: monetization.address });

        expectEvent(tx, 'NFTUnlocked', {
          tokenId: tokenId,
          owner: user1
        });

        const lockStatus = await nftContract.lockStatus(tokenId);
        assert.equal(lockStatus.toNumber(), LockStatus.Unlocked, "NFT should be unlocked");
      });

      it("should prevent unauthorized caller from unlocking", async () => {
        await expectRevert(
          nftContract.unlockNFT(tokenId, { from: user2 }),
          "Unauthorized: Caller is not authorized"
        );
      });
    });
  });

  describe("ERC721 Transfer Functions", () => {
    let tokenId;

    beforeEach(async () => {
      const tx = await nftContract.createNFT(
        user1,
        OwnershipLevel.Level3,
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

    describe("transferFrom", () => {
      it("should transfer unlocked NFT and update access", async () => {
        // Grant some additional access
        await masterAccess.grantAccess(nftAccess.address, user1, { from: deployer });
        await nftAccess.grantAccess(tokenId, user3, AccessLevel.UseModel, { from: user1 });

        // Transfer NFT
        await nftContract.transferFrom(user1, user2, tokenId, { from: user1 });

        // Verify ownership
        assert.equal(await nftContract.ownerOf(tokenId), user2, "User2 should own the NFT");

        // Verify access was transferred
        const user1Access = await nftAccess.getUserAccessLevel(tokenId, user1);
        const user2Access = await nftAccess.getUserAccessLevel(tokenId, user2);
        assert.equal(user1Access.toNumber(), AccessLevel.None, "User1 should have no access");
        assert.equal(user2Access.toNumber(), AccessLevel.AbsoluteOwnership, "User2 should have absolute ownership");

        // Other users' access should remain
        const user3Access = await nftAccess.getUserAccessLevel(tokenId, user3);
        assert.equal(user3Access.toNumber(), AccessLevel.UseModel, "User3 should retain their access");
      });

      it("should prevent transferring locked NFT", async () => {
        await nftContract.lockNFT(tokenId, { from: user1 });

        await expectRevert(
          nftContract.transferFrom(user1, user2, tokenId, { from: user1 }),
          "Cannot transfer locked NFT"
        );
      });

      it("should allow approved address to transfer", async () => {
        await nftContract.approve(user2, tokenId, { from: user1 });
        await nftContract.transferFrom(user1, user3, tokenId, { from: user2 });

        assert.equal(await nftContract.ownerOf(tokenId), user3, "User3 should own the NFT");
      });
    });

    describe("safeTransferFrom", () => {
      it("should safely transfer NFT with data", async () => {
        const data = "0x1234";
        await nftContract.methods['safeTransferFrom(address,address,uint256,bytes)'](
          user1, user2, tokenId, data, { from: user1 }
        );

        assert.equal(await nftContract.ownerOf(tokenId), user2, "User2 should own the NFT");
      });

      it("should safely transfer NFT without data", async () => {
        await nftContract.methods['safeTransferFrom(address,address,uint256)'](
          user1, user2, tokenId, { from: user1 }
        );

        assert.equal(await nftContract.ownerOf(tokenId), user2, "User2 should own the NFT");
      });

      it("should prevent safe transfer of locked NFT", async () => {
        await nftContract.lockNFT(tokenId, { from: user1 });

        await expectRevert(
          nftContract.methods['safeTransferFrom(address,address,uint256)'](
            user1, user2, tokenId, { from: user1 }
          ),
          "Cannot transfer locked NFT"
        );
      });
    });
  });

  describe("Token URI", () => {
    let tokenId;

    beforeEach(async () => {
      const tx = await nftContract.createNFT(
        user1,
        OwnershipLevel.Level3,
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

    it("should return correct token URI", async () => {
      const uri = await nftContract.tokenURI(tokenId);
      const expectedUri = `https://api.neuralabs.ai/nft/${tokenId}`;
      assert.equal(uri, expectedUri, "Token URI should be correct");
    });

    it("should revert for non-existent token", async () => {
      await expectRevert(
        nftContract.tokenURI(999),
        "ERC721URIStorage: URI query for nonexistent token"
      );
    });
  });

  describe("Monetization Integration", () => {
    it("should set monetization contract", async () => {
      const newMonetization = await Monetization.new(
        masterAccess.address,
        nftContract.address,
        nftAccess.address,
        nftMetadata.address,
        aiServiceAgreement.address,
        { from: deployer }
      );

      await nftContract.setMonetizationContract(newMonetization.address, { from: deployer });

      assert.equal(
        await nftContract.monetizationContract(),
        newMonetization.address,
        "Monetization contract should be updated"
      );
    });

    it("should prevent non-deployer from setting monetization contract", async () => {
      await expectRevert(
        nftContract.setMonetizationContract(user1, { from: user1 }),
        "Unauthorized: Only deployer can set"
      );
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle multiple NFTs with different ownership levels", async () => {
      const tokens = [];

      // Create NFTs with different ownership levels
      for (let level = 1; level <= 6; level++) {
        const tx = await nftContract.createNFT(
          user1,
          level,
          validMetadata.ipType,
          `model-${level}`,
          validMetadata.imageUrl,
          validMetadata.storageType,
          validMetadata.storageId,
          validMetadata.encrypted,
          validMetadata.encryptionId,
          validMetadata.md5Hash,
          validMetadata.version,
          { from: deployer }
        );
        const tokenId = tx.logs.find(log => log.event === 'Transfer').args.tokenId;
        tokens.push(tokenId);

        const ownershipLevel = await nftContract.nftOwnershipLevel(tokenId);
        assert.equal(ownershipLevel.toNumber(), level, `Token ${tokenId} should have ownership level ${level}`);
      }

      // Verify all tokens are owned by user1
      for (const tokenId of tokens) {
        assert.equal(await nftContract.ownerOf(tokenId), user1, `User1 should own token ${tokenId}`);
      }
    });

    it("should handle lock/unlock cycle with transfer", async () => {
      const tx = await nftContract.createNFT(
        user1,
        OwnershipLevel.Level3,
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
      const tokenId = tx.logs.find(log => log.event === 'Transfer').args.tokenId;

      // Lock NFT
      await nftContract.lockNFT(tokenId, { from: user1 });

      // Try to transfer - should fail
      await expectRevert(
        nftContract.transferFrom(user1, user2, tokenId, { from: user1 }),
        "Cannot transfer locked NFT"
      );

      // Initiate unlock
      await nftContract.initiateUnlock(tokenId, { from: user1 });

      // Still can't transfer during unlocking
      await expectRevert(
        nftContract.transferFrom(user1, user2, tokenId, { from: user1 }),
        "Cannot transfer locked NFT"
      );

      // Complete unlock
      await time.increase(time.duration.days(3));
      await nftContract.completeUnlock(tokenId, { from: user1 });

      // Now transfer should work
      await nftContract.transferFrom(user1, user2, tokenId, { from: user1 });
      assert.equal(await nftContract.ownerOf(tokenId), user2, "Transfer should succeed after unlock");
    });

    it("should handle burn with complex access setup", async () => {
      const tx = await nftContract.createNFT(
        user1,
        OwnershipLevel.Level6,
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
      const tokenId = tx.logs.find(log => log.event === 'Transfer').args.tokenId;

      // Set up complex access
      await masterAccess.grantAccess(nftAccess.address, user1, { from: deployer });
      await nftAccess.grantAccess(tokenId, user2, AccessLevel.EditData, { from: user1 });
      await nftAccess.grantAccess(tokenId, user3, AccessLevel.UseModel, { from: user1 });
      await nftAccess.setDefaultAccessLevel(tokenId, AccessLevel.ViewAndDownload, { from: user1 });
      await nftAccess.setMaximumAccessLevel(tokenId, AccessLevel.EditData, { from: user1 });

      // Burn NFT
      await nftContract.burnNFT(tokenId, { from: user1 });

      // Verify everything is cleaned up
      await expectRevert(nftContract.ownerOf(tokenId), "ERC721: owner query for nonexistent token");
      assert.equal((await nftAccess.getUserAccessLevel(tokenId, user1)).toNumber(), AccessLevel.None);
      assert.equal((await nftAccess.getUserAccessLevel(tokenId, user2)).toNumber(), AccessLevel.None);
      assert.equal((await nftAccess.getUserAccessLevel(tokenId, user3)).toNumber(), AccessLevel.None);
      assert.equal((await nftAccess.defaultAccessLevel(tokenId)).toNumber(), AccessLevel.None);
      assert.equal((await nftAccess.maximumAccessLevel(tokenId)).toNumber(), AccessLevel.None);
      assert.equal((await nftMetadata.metadataExists(tokenId)), false);
    });
  });
});