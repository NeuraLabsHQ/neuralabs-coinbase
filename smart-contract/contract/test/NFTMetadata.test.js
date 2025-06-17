const NFTMetadata = artifacts.require("NFTMetadata");
const MasterAccessControl = artifacts.require("MasterAccessControl");
const NFTAccessControl = artifacts.require("NFTAccessControl");
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');

contract("NFTMetadata", (accounts) => {
  const [deployer, nftContract, user1, user2, unauthorized] = accounts;
  let nftMetadata, masterAccess, nftAccess;
  
  // Valid IP types and storage types
  const IPType = {
    FLOW: "flow",
    MODEL: "model",
    DATA: "data"
  };
  
  const StorageType = {
    NEURALABS: "neuralabs",
    NEURALABS_DECENTRALIZED: "neuralabs-decentralized",
    CUSTOM: "custom"
  };

  // Access levels for testing
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
    // Deploy contracts
    masterAccess = await MasterAccessControl.new({ from: deployer });
    nftAccess = await NFTAccessControl.new(masterAccess.address, { from: deployer });
    nftMetadata = await NFTMetadata.new(masterAccess.address, nftAccess.address, { from: deployer });
    
    // Grant permissions
    await masterAccess.grantAccess(nftMetadata.address, nftContract, { from: deployer });
    await masterAccess.grantAccess(nftAccess.address, nftContract, { from: deployer });
  });

  describe("Deployment", () => {
    it("should set correct initial values", async () => {
      const masterAccessAddr = await nftMetadata.masterAccessControl();
      const nftAccessAddr = await nftMetadata.nftAccessControl();
      
      assert.equal(masterAccessAddr, masterAccess.address, "MasterAccessControl should be set");
      assert.equal(nftAccessAddr, nftAccess.address, "NFTAccessControl should be set");
    });
  });

  describe("Metadata Creation", () => {
    const tokenId = 1;
    const validMetadata = {
      ipType: IPType.MODEL,
      ipId: "model-123",
      imageUrl: "https://example.com/image.png",
      storageType: StorageType.NEURALABS,
      storageId: "storage-123",
      encrypted: true,
      encryptionId: "encryption-123",
      md5Hash: "d41d8cd98f00b204e9800998ecf8427e",
      version: "1.0.0"
    };

    describe("createMetadata", () => {
      it("should create metadata with valid parameters", async () => {
        const tx = await nftMetadata.createMetadata(
          tokenId,
          user1,
          validMetadata.ipType,
          validMetadata.ipId,
          validMetadata.imageUrl,
          validMetadata.storageType,
          validMetadata.storageId,
          validMetadata.encrypted,
          validMetadata.encryptionId,
          validMetadata.md5Hash,
          validMetadata.version,
          { from: nftContract }
        );

        expectEvent(tx, 'MetadataCreated', {
          tokenId: tokenId.toString(),
          creator: user1,
          ipType: validMetadata.ipType,
          ipId: validMetadata.ipId
        });

        // Verify metadata was stored correctly
        const metadata = await nftMetadata.getMetadata(tokenId);
        assert.equal(metadata.creator, user1, "Creator should be set");
        assert.equal(metadata.ipType, validMetadata.ipType, "IP type should be set");
        assert.equal(metadata.ipId, validMetadata.ipId, "IP ID should be set");
        assert.equal(metadata.imageUrl, validMetadata.imageUrl, "Image URL should be set");
        assert.equal(metadata.storageType, validMetadata.storageType, "Storage type should be set");
        assert.equal(metadata.storageId, validMetadata.storageId, "Storage ID should be set");
        assert.equal(metadata.encrypted, validMetadata.encrypted, "Encrypted flag should be set");
        assert.equal(metadata.encryptionId, validMetadata.encryptionId, "Encryption ID should be set");
        assert.equal(metadata.md5Hash, validMetadata.md5Hash, "MD5 hash should be set");
        assert.equal(metadata.version, validMetadata.version, "Version should be set");
      });

      it("should prevent creating metadata for existing token", async () => {
        await nftMetadata.createMetadata(
          tokenId,
          user1,
          validMetadata.ipType,
          validMetadata.ipId,
          validMetadata.imageUrl,
          validMetadata.storageType,
          validMetadata.storageId,
          validMetadata.encrypted,
          validMetadata.encryptionId,
          validMetadata.md5Hash,
          validMetadata.version,
          { from: nftContract }
        );

        await expectRevert(
          nftMetadata.createMetadata(
            tokenId,
            user1,
            validMetadata.ipType,
            validMetadata.ipId,
            validMetadata.imageUrl,
            validMetadata.storageType,
            validMetadata.storageId,
            validMetadata.encrypted,
            validMetadata.encryptionId,
            validMetadata.md5Hash,
            validMetadata.version,
            { from: nftContract }
          ),
          "Metadata already exists for this token"
        );
      });

      it("should validate IP type", async () => {
        await expectRevert(
          nftMetadata.createMetadata(
            tokenId,
            user1,
            "invalid-type",
            validMetadata.ipId,
            validMetadata.imageUrl,
            validMetadata.storageType,
            validMetadata.storageId,
            validMetadata.encrypted,
            validMetadata.encryptionId,
            validMetadata.md5Hash,
            validMetadata.version,
            { from: nftContract }
          ),
          "Invalid IP type"
        );
      });

      it("should validate storage type", async () => {
        await expectRevert(
          nftMetadata.createMetadata(
            tokenId,
            user1,
            validMetadata.ipType,
            validMetadata.ipId,
            validMetadata.imageUrl,
            "invalid-storage",
            validMetadata.storageId,
            validMetadata.encrypted,
            validMetadata.encryptionId,
            validMetadata.md5Hash,
            validMetadata.version,
            { from: nftContract }
          ),
          "Invalid storage type"
        );
      });

      it("should require encryption ID when encrypted is true", async () => {
        await expectRevert(
          nftMetadata.createMetadata(
            tokenId,
            user1,
            validMetadata.ipType,
            validMetadata.ipId,
            validMetadata.imageUrl,
            validMetadata.storageType,
            validMetadata.storageId,
            true, // encrypted
            "", // empty encryption ID
            validMetadata.md5Hash,
            validMetadata.version,
            { from: nftContract }
          ),
          "Encryption ID required when encrypted"
        );
      });

      it("should prevent unauthorized caller from creating metadata", async () => {
        await expectRevert(
          nftMetadata.createMetadata(
            tokenId,
            user1,
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
    });

    describe("replicateNFT", () => {
      const newTokenId = 2;

      beforeEach(async () => {
        await nftMetadata.createMetadata(
          tokenId,
          user1,
          validMetadata.ipType,
          validMetadata.ipId,
          validMetadata.imageUrl,
          validMetadata.storageType,
          validMetadata.storageId,
          validMetadata.encrypted,
          validMetadata.encryptionId,
          validMetadata.md5Hash,
          validMetadata.version,
          { from: nftContract }
        );
      });

      it("should replicate metadata to new token", async () => {
        const tx = await nftMetadata.replicateNFT(tokenId, newTokenId, user2, { from: nftContract });

        expectEvent(tx, 'MetadataReplicated', {
          originalTokenId: tokenId.toString(),
          newTokenId: newTokenId.toString(),
          newOwner: user2
        });

        // Verify replicated metadata
        const originalMetadata = await nftMetadata.getMetadata(tokenId);
        const replicatedMetadata = await nftMetadata.getMetadata(newTokenId);

        assert.equal(replicatedMetadata.creator, user2, "New creator should be set");
        assert.equal(replicatedMetadata.ipType, originalMetadata.ipType, "IP type should match");
        assert.equal(replicatedMetadata.ipId, originalMetadata.ipId, "IP ID should match");
        assert.equal(replicatedMetadata.imageUrl, originalMetadata.imageUrl, "Image URL should match");
        assert.equal(replicatedMetadata.storageType, originalMetadata.storageType, "Storage type should match");
        assert.equal(replicatedMetadata.storageId, originalMetadata.storageId, "Storage ID should match");
        assert.equal(replicatedMetadata.encrypted, originalMetadata.encrypted, "Encrypted flag should match");
        assert.equal(replicatedMetadata.encryptionId, originalMetadata.encryptionId, "Encryption ID should match");
        assert.equal(replicatedMetadata.md5Hash, originalMetadata.md5Hash, "MD5 hash should match");
        assert.equal(replicatedMetadata.version, originalMetadata.version, "Version should match");
      });

      it("should prevent replicating non-existent metadata", async () => {
        await expectRevert(
          nftMetadata.replicateNFT(999, newTokenId, user2, { from: nftContract }),
          "No metadata exists for original token"
        );
      });

      it("should prevent replicating to existing token", async () => {
        await nftMetadata.replicateNFT(tokenId, newTokenId, user2, { from: nftContract });

        await expectRevert(
          nftMetadata.replicateNFT(tokenId, newTokenId, user2, { from: nftContract }),
          "Metadata already exists for new token"
        );
      });
    });
  });

  describe("Metadata Updates", () => {
    const tokenId = 1;
    const validMetadata = {
      ipType: IPType.MODEL,
      ipId: "model-123",
      imageUrl: "https://example.com/image.png",
      storageType: StorageType.NEURALABS,
      storageId: "storage-123",
      encrypted: true,
      encryptionId: "encryption-123",
      md5Hash: "d41d8cd98f00b204e9800998ecf8427e",
      version: "1.0.0"
    };

    beforeEach(async () => {
      await nftMetadata.createMetadata(
        tokenId,
        user1,
        validMetadata.ipType,
        validMetadata.ipId,
        validMetadata.imageUrl,
        validMetadata.storageType,
        validMetadata.storageId,
        validMetadata.encrypted,
        validMetadata.encryptionId,
        validMetadata.md5Hash,
        validMetadata.version,
        { from: nftContract }
      );
    });

    describe("updateMetadata", () => {
      it("should update metadata with EditData access", async () => {
        // Grant EditData access to user2
        await nftAccess.grantAccess(tokenId, user2, AccessLevel.EditData, { from: nftContract });

        const newImageUrl = "https://example.com/new-image.png";
        const newVersion = "2.0.0";

        const tx = await nftMetadata.updateMetadata(
          tokenId,
          validMetadata.ipType,
          validMetadata.ipId,
          newImageUrl,
          validMetadata.storageType,
          validMetadata.storageId,
          validMetadata.encrypted,
          validMetadata.encryptionId,
          validMetadata.md5Hash,
          newVersion,
          { from: user2 }
        );

        expectEvent(tx, 'MetadataUpdated', {
          tokenId: tokenId.toString(),
          updater: user2
        });

        const metadata = await nftMetadata.getMetadata(tokenId);
        assert.equal(metadata.imageUrl, newImageUrl, "Image URL should be updated");
        assert.equal(metadata.version, newVersion, "Version should be updated");
      });

      it("should prevent update without EditData access", async () => {
        // Grant only UseModel access to user2
        await nftAccess.grantAccess(tokenId, user2, AccessLevel.UseModel, { from: nftContract });

        await expectRevert(
          nftMetadata.updateMetadata(
            tokenId,
            validMetadata.ipType,
            validMetadata.ipId,
            "https://example.com/new-image.png",
            validMetadata.storageType,
            validMetadata.storageId,
            validMetadata.encrypted,
            validMetadata.encryptionId,
            validMetadata.md5Hash,
            "2.0.0",
            { from: user2 }
          ),
          "Insufficient access level"
        );
      });

      it("should prevent changing IP type during update", async () => {
        await nftAccess.grantAccess(tokenId, user2, AccessLevel.EditData, { from: nftContract });

        await expectRevert(
          nftMetadata.updateMetadata(
            tokenId,
            IPType.DATA, // Different IP type
            validMetadata.ipId,
            validMetadata.imageUrl,
            validMetadata.storageType,
            validMetadata.storageId,
            validMetadata.encrypted,
            validMetadata.encryptionId,
            validMetadata.md5Hash,
            "2.0.0",
            { from: user2 }
          ),
          "Cannot change IP type"
        );
      });

      it("should validate new storage type", async () => {
        await nftAccess.grantAccess(tokenId, user2, AccessLevel.EditData, { from: nftContract });

        await expectRevert(
          nftMetadata.updateMetadata(
            tokenId,
            validMetadata.ipType,
            validMetadata.ipId,
            validMetadata.imageUrl,
            "invalid-storage",
            validMetadata.storageId,
            validMetadata.encrypted,
            validMetadata.encryptionId,
            validMetadata.md5Hash,
            "2.0.0",
            { from: user2 }
          ),
          "Invalid storage type"
        );
      });

      it("should prevent update for non-existent token", async () => {
        await nftAccess.grantAccess(999, user2, AccessLevel.EditData, { from: nftContract });

        await expectRevert(
          nftMetadata.updateMetadata(
            999,
            validMetadata.ipType,
            validMetadata.ipId,
            validMetadata.imageUrl,
            validMetadata.storageType,
            validMetadata.storageId,
            validMetadata.encrypted,
            validMetadata.encryptionId,
            validMetadata.md5Hash,
            "2.0.0",
            { from: user2 }
          ),
          "No metadata exists for this token"
        );
      });
    });

    describe("deleteMetadata", () => {
      it("should delete metadata when called by authorized contract", async () => {
        const tx = await nftMetadata.deleteMetadata(tokenId, { from: nftContract });

        expectEvent(tx, 'MetadataDeleted', {
          tokenId: tokenId.toString()
        });

        // Verify metadata is deleted
        const metadata = await nftMetadata.getMetadata(tokenId);
        assert.equal(metadata.creator, "0x0000000000000000000000000000000000000000", "Creator should be zero");
        assert.equal(metadata.ipType, "", "IP type should be empty");
        assert.equal(metadata.ipId, "", "IP ID should be empty");
      });

      it("should prevent unauthorized deletion", async () => {
        await expectRevert(
          nftMetadata.deleteMetadata(tokenId, { from: unauthorized }),
          "Unauthorized: Caller is not authorized"
        );
      });

      it("should handle deletion of non-existent metadata", async () => {
        // Should not revert, just emit event
        const tx = await nftMetadata.deleteMetadata(999, { from: nftContract });
        expectEvent(tx, 'MetadataDeleted', {
          tokenId: "999"
        });
      });
    });
  });

  describe("Metadata Queries", () => {
    const tokenIds = [1, 2, 3];
    const metadata = [
      {
        ipType: IPType.MODEL,
        ipId: "model-1",
        imageUrl: "https://example.com/image1.png",
        storageType: StorageType.NEURALABS,
        storageId: "storage-1",
        encrypted: false,
        encryptionId: "",
        md5Hash: "hash1",
        version: "1.0.0"
      },
      {
        ipType: IPType.DATA,
        ipId: "data-2",
        imageUrl: "https://example.com/image2.png",
        storageType: StorageType.NEURALABS_DECENTRALIZED,
        storageId: "storage-2",
        encrypted: true,
        encryptionId: "enc-2",
        md5Hash: "hash2",
        version: "1.0.0"
      },
      {
        ipType: IPType.FLOW,
        ipId: "flow-3",
        imageUrl: "https://example.com/image3.png",
        storageType: StorageType.CUSTOM,
        storageId: "storage-3",
        encrypted: false,
        encryptionId: "",
        md5Hash: "hash3",
        version: "1.0.0"
      }
    ];

    beforeEach(async () => {
      for (let i = 0; i < tokenIds.length; i++) {
        await nftMetadata.createMetadata(
          tokenIds[i],
          user1,
          metadata[i].ipType,
          metadata[i].ipId,
          metadata[i].imageUrl,
          metadata[i].storageType,
          metadata[i].storageId,
          metadata[i].encrypted,
          metadata[i].encryptionId,
          metadata[i].md5Hash,
          metadata[i].version,
          { from: nftContract }
        );
      }
    });

    describe("getMetadata", () => {
      it("should return correct metadata for each token", async () => {
        for (let i = 0; i < tokenIds.length; i++) {
          const result = await nftMetadata.getMetadata(tokenIds[i]);
          assert.equal(result.ipType, metadata[i].ipType, `IP type should match for token ${tokenIds[i]}`);
          assert.equal(result.ipId, metadata[i].ipId, `IP ID should match for token ${tokenIds[i]}`);
          assert.equal(result.encrypted, metadata[i].encrypted, `Encrypted flag should match for token ${tokenIds[i]}`);
        }
      });

      it("should return empty metadata for non-existent token", async () => {
        const result = await nftMetadata.getMetadata(999);
        assert.equal(result.creator, "0x0000000000000000000000000000000000000000", "Creator should be zero");
        assert.equal(result.ipType, "", "IP type should be empty");
        assert.equal(result.ipId, "", "IP ID should be empty");
      });
    });

    describe("metadataExists", () => {
      it("should return true for existing metadata", async () => {
        for (const tokenId of tokenIds) {
          const exists = await nftMetadata.metadataExists(tokenId);
          assert.equal(exists, true, `Metadata should exist for token ${tokenId}`);
        }
      });

      it("should return false for non-existent metadata", async () => {
        const exists = await nftMetadata.metadataExists(999);
        assert.equal(exists, false, "Metadata should not exist");
      });
    });

    describe("getIPType", () => {
      it("should return correct IP type for each token", async () => {
        for (let i = 0; i < tokenIds.length; i++) {
          const ipType = await nftMetadata.getIPType(tokenIds[i]);
          assert.equal(ipType, metadata[i].ipType, `IP type should match for token ${tokenIds[i]}`);
        }
      });

      it("should return empty string for non-existent token", async () => {
        const ipType = await nftMetadata.getIPType(999);
        assert.equal(ipType, "", "IP type should be empty");
      });
    });
  });

  describe("Validation Functions", () => {
    describe("isValidIPType", () => {
      it("should return true for valid IP types", async () => {
        assert.equal(await nftMetadata.isValidIPType(IPType.FLOW), true);
        assert.equal(await nftMetadata.isValidIPType(IPType.MODEL), true);
        assert.equal(await nftMetadata.isValidIPType(IPType.DATA), true);
      });

      it("should return false for invalid IP types", async () => {
        assert.equal(await nftMetadata.isValidIPType("invalid"), false);
        assert.equal(await nftMetadata.isValidIPType(""), false);
        assert.equal(await nftMetadata.isValidIPType("FLOW"), false); // Case sensitive
      });
    });

    describe("isValidStorageType", () => {
      it("should return true for valid storage types", async () => {
        assert.equal(await nftMetadata.isValidStorageType(StorageType.NEURALABS), true);
        assert.equal(await nftMetadata.isValidStorageType(StorageType.NEURALABS_DECENTRALIZED), true);
        assert.equal(await nftMetadata.isValidStorageType(StorageType.CUSTOM), true);
      });

      it("should return false for invalid storage types", async () => {
        assert.equal(await nftMetadata.isValidStorageType("invalid"), false);
        assert.equal(await nftMetadata.isValidStorageType(""), false);
        assert.equal(await nftMetadata.isValidStorageType("NEURALABS"), false); // Case sensitive
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty strings in non-required fields", async () => {
      const tokenId = 1;
      
      await nftMetadata.createMetadata(
        tokenId,
        user1,
        IPType.MODEL,
        "model-123",
        "", // empty image URL
        StorageType.NEURALABS,
        "storage-123",
        false, // not encrypted
        "", // empty encryption ID (valid when not encrypted)
        "", // empty MD5 hash
        "", // empty version
        { from: nftContract }
      );

      const metadata = await nftMetadata.getMetadata(tokenId);
      assert.equal(metadata.imageUrl, "", "Empty image URL should be allowed");
      assert.equal(metadata.md5Hash, "", "Empty MD5 hash should be allowed");
      assert.equal(metadata.version, "", "Empty version should be allowed");
    });

    it("should handle very long strings", async () => {
      const tokenId = 1;
      const longString = "a".repeat(1000); // 1000 character string
      
      await nftMetadata.createMetadata(
        tokenId,
        user1,
        IPType.MODEL,
        longString,
        longString,
        StorageType.NEURALABS,
        longString,
        false,
        "",
        longString,
        longString,
        { from: nftContract }
      );

      const metadata = await nftMetadata.getMetadata(tokenId);
      assert.equal(metadata.ipId, longString, "Long IP ID should be stored");
      assert.equal(metadata.imageUrl, longString, "Long image URL should be stored");
    });

    it("should handle maximum uint256 token ID", async () => {
      const maxTokenId = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
      
      await nftMetadata.createMetadata(
        maxTokenId,
        user1,
        IPType.MODEL,
        "model-max",
        "https://example.com/max.png",
        StorageType.NEURALABS,
        "storage-max",
        false,
        "",
        "hash-max",
        "1.0.0",
        { from: nftContract }
      );

      const exists = await nftMetadata.metadataExists(maxTokenId);
      assert.equal(exists, true, "Should handle max uint256 token ID");
    });
  });
});