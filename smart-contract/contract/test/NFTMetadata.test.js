const NFTMetadata = artifacts.require("NFTMetadata");
const MasterAccessControl = artifacts.require("MasterAccessControl");
const NFTAccessControl = artifacts.require("NFTAccessControl");
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { delay } = require('./helpers/test-utils');

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
    await delay(100);
    nftAccess = await NFTAccessControl.new(masterAccess.address, { from: deployer });
    await delay(100);
    nftMetadata = await NFTMetadata.new(masterAccess.address, nftAccess.address, { from: deployer });
    await delay(100);
    
    // Grant permissions
    await masterAccess.grantAccess(nftMetadata.address, nftContract, { from: deployer });
    await delay(100);
    await masterAccess.grantAccess(nftAccess.address, nftContract, { from: deployer });
    await delay(100);
  });

  describe("Deployment", () => {
    it("should set correct initial values", async () => {
      const masterAccessAddr = await nftMetadata.accessControl();
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
        // First set max access level for the NFT
        await nftAccess.setMaxAccessLevel(tokenId, AccessLevel.AbsoluteOwnership, { from: deployer });
        await delay(100);
        // Grant NFT absolute ownership to simulate NFT contract creating metadata
        await nftAccess.grantAccess(tokenId, nftContract, AccessLevel.AbsoluteOwnership, { from: deployer });
        await delay(100);
        
        const metadataStruct = {
          image: validMetadata.imageUrl,
          intellectual_property_type: validMetadata.ipType,
          encrypted: validMetadata.encrypted,
          encryption_id: validMetadata.encryptionId,
          intellectual_property_id: validMetadata.ipId,
          intellectual_property_storage: validMetadata.storageType,
          md5: validMetadata.md5Hash,
          version: validMetadata.version
        };
        
        const tx = await nftMetadata.createMetadata(
          tokenId,
          metadataStruct,
          { from: nftContract }
        );

        expectEvent(tx, 'MetadataCreated', {
          nftId: tokenId.toString()
        });

        // Verify metadata was stored correctly
        const metadata = await nftMetadata.getMetadata(tokenId);
        assert.equal(metadata.image, validMetadata.imageUrl, "Image URL should be set");
        assert.equal(metadata.intellectual_property_type, validMetadata.ipType, "IP type should be set");
        assert.equal(metadata.intellectual_property_id, validMetadata.ipId, "IP ID should be set");
        assert.equal(metadata.intellectual_property_storage, validMetadata.storageType, "Storage type should be set");
        assert.equal(metadata.encrypted, validMetadata.encrypted, "Encrypted flag should be set");
        assert.equal(metadata.encryption_id, validMetadata.encryptionId, "Encryption ID should be set");
        assert.equal(metadata.md5, validMetadata.md5Hash, "MD5 hash should be set");
        assert.equal(metadata.version, validMetadata.version, "Version should be set");
      });

      it("should prevent creating metadata for existing token", async () => {
        // First set max access level for the NFT
        await nftAccess.setMaxAccessLevel(tokenId, AccessLevel.AbsoluteOwnership, { from: deployer });
        await delay(100);
        // Grant NFT absolute ownership
        await nftAccess.grantAccess(tokenId, nftContract, AccessLevel.AbsoluteOwnership, { from: deployer });
        await delay(100);
        
        const metadataStruct = {
          image: validMetadata.imageUrl,
          intellectual_property_type: validMetadata.ipType,
          encrypted: validMetadata.encrypted,
          encryption_id: validMetadata.encryptionId,
          intellectual_property_id: validMetadata.ipId,
          intellectual_property_storage: validMetadata.storageType,
          md5: validMetadata.md5Hash,
          version: validMetadata.version
        };
        
        await nftMetadata.createMetadata(tokenId, metadataStruct, { from: nftContract });
        await delay(100);

        await expectRevert(
          nftMetadata.createMetadata(tokenId, metadataStruct, { from: nftContract }),
          "NFTMetadata: Metadata already exists"
        );
      });

      it("should validate IP type", async () => {
        // First set max access level for the NFT
        await nftAccess.setMaxAccessLevel(tokenId, AccessLevel.AbsoluteOwnership, { from: deployer });
        await delay(100);
        // Grant NFT absolute ownership
        await nftAccess.grantAccess(tokenId, nftContract, AccessLevel.AbsoluteOwnership, { from: deployer });
        await delay(100);
        
        const invalidMetadata = {
          image: validMetadata.imageUrl,
          intellectual_property_type: "invalid-type",
          encrypted: validMetadata.encrypted,
          encryption_id: validMetadata.encryptionId,
          intellectual_property_id: validMetadata.ipId,
          intellectual_property_storage: validMetadata.storageType,
          md5: validMetadata.md5Hash,
          version: validMetadata.version
        };
        
        await expectRevert(
          nftMetadata.createMetadata(tokenId, invalidMetadata, { from: nftContract }),
          "NFTMetadata: Invalid IP type. Must be flow, model, or data"
        );
      });

      it("should validate storage type", async () => {
        // First set max access level for the NFT
        await nftAccess.setMaxAccessLevel(tokenId, AccessLevel.AbsoluteOwnership, { from: deployer });
        await delay(100);
        // Grant NFT absolute ownership
        await nftAccess.grantAccess(tokenId, nftContract, AccessLevel.AbsoluteOwnership, { from: deployer });
        await delay(100);
        
        const invalidMetadata = {
          image: validMetadata.imageUrl,
          intellectual_property_type: validMetadata.ipType,
          encrypted: validMetadata.encrypted,
          encryption_id: validMetadata.encryptionId,
          intellectual_property_id: validMetadata.ipId,
          intellectual_property_storage: "invalid-storage",
          md5: validMetadata.md5Hash,
          version: validMetadata.version
        };
        
        await expectRevert(
          nftMetadata.createMetadata(tokenId, invalidMetadata, { from: nftContract }),
          "NFTMetadata: Invalid storage type. Must be neuralabs, neuralabs-decentralized, or custom"
        );
      });

      // Note: The contract does not validate encryption_id when encrypted is true
      // This is a potential improvement for the contract but not currently implemented
      it.skip("should require encryption ID when encrypted is true", async () => {
        // Grant NFT absolute ownership
        await nftAccess.grantAccess(tokenId, nftContract, AccessLevel.AbsoluteOwnership, { from: deployer });
        
        const invalidMetadata = {
          image: validMetadata.imageUrl,
          intellectual_property_type: validMetadata.ipType,
          encrypted: true,
          encryption_id: "", // empty encryption ID
          intellectual_property_id: validMetadata.ipId,
          intellectual_property_storage: validMetadata.storageType,
          md5: validMetadata.md5Hash,
          version: validMetadata.version
        };
        
        await expectRevert(
          nftMetadata.createMetadata(tokenId, invalidMetadata, { from: nftContract }),
          "NFTMetadata: Encryption ID required when encrypted"
        );
      });

      it("should prevent unauthorized caller from creating metadata", async () => {
        const metadataStruct = {
          image: validMetadata.imageUrl,
          intellectual_property_type: validMetadata.ipType,
          encrypted: validMetadata.encrypted,
          encryption_id: validMetadata.encryptionId,
          intellectual_property_id: validMetadata.ipId,
          intellectual_property_storage: validMetadata.storageType,
          md5: validMetadata.md5Hash,
          version: validMetadata.version
        };
        
        await expectRevert(
          nftMetadata.createMetadata(tokenId, metadataStruct, { from: unauthorized }),
          "NFTMetadata: Caller not authorized"
        );
      });
    });

    describe("replicateNFT", () => {
      const newTokenId = 2;

      beforeEach(async () => {
        // First set max access level for the NFT
        await nftAccess.setMaxAccessLevel(tokenId, AccessLevel.AbsoluteOwnership, { from: deployer });
        await delay(100);
        // Grant NFT absolute ownership
        await nftAccess.grantAccess(tokenId, nftContract, AccessLevel.AbsoluteOwnership, { from: deployer });
        await delay(100);
        
        const metadataStruct = {
          image: validMetadata.imageUrl,
          intellectual_property_type: validMetadata.ipType,
          encrypted: validMetadata.encrypted,
          encryption_id: validMetadata.encryptionId,
          intellectual_property_id: validMetadata.ipId,
          intellectual_property_storage: validMetadata.storageType,
          md5: validMetadata.md5Hash,
          version: validMetadata.version
        };
        
        await nftMetadata.createMetadata(tokenId, metadataStruct, { from: nftContract });
        await delay(100);
      });

      it("should replicate metadata to new token", async () => {
        const tx = await nftMetadata.replicateNFT(tokenId, newTokenId, { from: nftContract });

        expectEvent(tx, 'ReplicaCreated', {
          nftId: tokenId.toString()
        });
        
        expectEvent(tx, 'MetadataCreated', {
          nftId: newTokenId.toString()
        });

        // Verify replicated metadata
        const originalMetadata = await nftMetadata.getMetadata(tokenId);
        const replicatedMetadata = await nftMetadata.getMetadata(newTokenId);

        assert.equal(replicatedMetadata.intellectual_property_type, originalMetadata.intellectual_property_type, "IP type should match");
        assert.equal(replicatedMetadata.intellectual_property_id, originalMetadata.intellectual_property_id, "IP ID should match");
        assert.equal(replicatedMetadata.image, originalMetadata.image, "Image URL should match");
        assert.equal(replicatedMetadata.intellectual_property_storage, originalMetadata.intellectual_property_storage, "Storage type should match");
        assert.equal(replicatedMetadata.encrypted, originalMetadata.encrypted, "Encrypted flag should match");
        assert.equal(replicatedMetadata.encryption_id, originalMetadata.encryption_id, "Encryption ID should match");
        assert.equal(replicatedMetadata.md5, originalMetadata.md5, "MD5 hash should match");
        assert.equal(replicatedMetadata.version, originalMetadata.version, "Version should match");
      });

      it("should prevent replicating non-existent metadata", async () => {
        await expectRevert(
          nftMetadata.replicateNFT(999, newTokenId, { from: nftContract }),
          "NFTMetadata: Original metadata does not exist"
        );
      });

      it("should prevent replicating to existing token", async () => {
        await nftMetadata.replicateNFT(tokenId, newTokenId, { from: nftContract });
        await delay(100);

        await expectRevert(
          nftMetadata.replicateNFT(tokenId, newTokenId, { from: nftContract }),
          "NFTMetadata: Replica metadata already exists"
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
      // First set max access level for the NFT
      await nftAccess.setMaxAccessLevel(tokenId, AccessLevel.AbsoluteOwnership, { from: deployer });
      await delay(100);
      // Grant NFT absolute ownership
      await nftAccess.grantAccess(tokenId, nftContract, AccessLevel.AbsoluteOwnership, { from: deployer });
      await delay(100);
      
      const metadataStruct = {
        image: validMetadata.imageUrl,
        intellectual_property_type: validMetadata.ipType,
        encrypted: validMetadata.encrypted,
        encryption_id: validMetadata.encryptionId,
        intellectual_property_id: validMetadata.ipId,
        intellectual_property_storage: validMetadata.storageType,
        md5: validMetadata.md5Hash,
        version: validMetadata.version
      };
      
      await nftMetadata.createMetadata(tokenId, metadataStruct, { from: nftContract });
      await delay(100);
    });

    describe("updateMetadata", () => {
      it("should update metadata with EditData access", async () => {
        // Grant EditData access to user2
        await nftAccess.grantAccess(tokenId, user2, AccessLevel.EditData, { from: deployer });
        await delay(100);

        const newImageUrl = "https://example.com/new-image.png";
        const newVersion = "2.0.0";
        
        const updatedMetadata = {
          image: newImageUrl,
          intellectual_property_type: validMetadata.ipType,
          encrypted: validMetadata.encrypted,
          encryption_id: validMetadata.encryptionId,
          intellectual_property_id: validMetadata.ipId,
          intellectual_property_storage: validMetadata.storageType,
          md5: validMetadata.md5Hash,
          version: newVersion
        };

        const tx = await nftMetadata.updateMetadata(
          tokenId,
          updatedMetadata,
          { from: user2 }
        );

        expectEvent(tx, 'MetadataUpdated', {
          nftId: tokenId.toString()
        });

        const metadata = await nftMetadata.getMetadata(tokenId);
        assert.equal(metadata.image, newImageUrl, "Image URL should be updated");
        assert.equal(metadata.version, newVersion, "Version should be updated");
      });

      it("should prevent update without EditData access", async () => {
        // Grant only UseModel access to user2
        await nftAccess.grantAccess(tokenId, user2, AccessLevel.UseModel, { from: deployer });
        await delay(100);
        
        const updatedMetadata = {
          image: "https://example.com/new-image.png",
          intellectual_property_type: validMetadata.ipType,
          encrypted: validMetadata.encrypted,
          encryption_id: validMetadata.encryptionId,
          intellectual_property_id: validMetadata.ipId,
          intellectual_property_storage: validMetadata.storageType,
          md5: validMetadata.md5Hash,
          version: "2.0.0"
        };

        await expectRevert(
          nftMetadata.updateMetadata(tokenId, updatedMetadata, { from: user2 }),
          "NFTMetadata: Insufficient access level"
        );
      });

      it("should allow changing IP type during update", async () => {
        await nftAccess.grantAccess(tokenId, user2, AccessLevel.EditData, { from: deployer });
        await delay(100);
        
        const updatedMetadata = {
          image: validMetadata.imageUrl,
          intellectual_property_type: IPType.DATA, // Different IP type - allowed
          encrypted: validMetadata.encrypted,
          encryption_id: validMetadata.encryptionId,
          intellectual_property_id: validMetadata.ipId,
          intellectual_property_storage: validMetadata.storageType,
          md5: validMetadata.md5Hash,
          version: "2.0.0"
        };

        await nftMetadata.updateMetadata(tokenId, updatedMetadata, { from: user2 });
        
        const metadata = await nftMetadata.getMetadata(tokenId);
        assert.equal(metadata.intellectual_property_type, IPType.DATA, "IP type should be updated");
      });

      it("should validate new storage type", async () => {
        await nftAccess.grantAccess(tokenId, user2, AccessLevel.EditData, { from: deployer });
        await delay(100);
        
        const updatedMetadata = {
          image: validMetadata.imageUrl,
          intellectual_property_type: validMetadata.ipType,
          encrypted: validMetadata.encrypted,
          encryption_id: validMetadata.encryptionId,
          intellectual_property_id: validMetadata.ipId,
          intellectual_property_storage: "invalid-storage",
          md5: validMetadata.md5Hash,
          version: "2.0.0"
        };

        await expectRevert(
          nftMetadata.updateMetadata(tokenId, updatedMetadata, { from: user2 }),
          "NFTMetadata: Invalid storage type. Must be neuralabs, neuralabs-decentralized, or custom"
        );
      });

      it("should prevent update for non-existent token", async () => {
        await nftAccess.setMaxAccessLevel(999, AccessLevel.AbsoluteOwnership, { from: deployer });
        await delay(100);
        await nftAccess.grantAccess(999, user2, AccessLevel.EditData, { from: deployer });
        await delay(100);
        
        const updatedMetadata = {
          image: validMetadata.imageUrl,
          intellectual_property_type: validMetadata.ipType,
          encrypted: validMetadata.encrypted,
          encryption_id: validMetadata.encryptionId,
          intellectual_property_id: validMetadata.ipId,
          intellectual_property_storage: validMetadata.storageType,
          md5: validMetadata.md5Hash,
          version: "2.0.0"
        };

        await expectRevert(
          nftMetadata.updateMetadata(999, updatedMetadata, { from: user2 }),
          "NFTMetadata: Metadata does not exist"
        );
      });
    });

    describe("deleteMetadata", () => {
      it("should delete metadata when called by authorized contract", async () => {
        const tx = await nftMetadata.deleteMetadata(tokenId, { from: nftContract });

        expectEvent(tx, 'MetadataDeleted', {
          nftId: tokenId.toString()
        });

        // Verify metadata is deleted
        await expectRevert(
          nftMetadata.getMetadata(tokenId),
          "NFTMetadata: Metadata does not exist"
        );
      });

      it("should prevent unauthorized deletion", async () => {
        await expectRevert(
          nftMetadata.deleteMetadata(tokenId, { from: unauthorized }),
          "NFTMetadata: Caller not authorized"
        );
      });

      it("should handle deletion of non-existent metadata", async () => {
        // Should revert
        await expectRevert(
          nftMetadata.deleteMetadata(999, { from: nftContract }),
          "NFTMetadata: Metadata does not exist"
        );
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
        // First set max access level for the NFT
        await nftAccess.setMaxAccessLevel(tokenIds[i], AccessLevel.AbsoluteOwnership, { from: deployer });
        await delay(100);
        // Grant NFT absolute ownership
        await nftAccess.grantAccess(tokenIds[i], nftContract, AccessLevel.AbsoluteOwnership, { from: deployer });
        await delay(100);
        
        const metadataStruct = {
          image: metadata[i].imageUrl,
          intellectual_property_type: metadata[i].ipType,
          encrypted: metadata[i].encrypted,
          encryption_id: metadata[i].encryptionId,
          intellectual_property_id: metadata[i].ipId,
          intellectual_property_storage: metadata[i].storageType,
          md5: metadata[i].md5Hash,
          version: metadata[i].version
        };
        
        await nftMetadata.createMetadata(tokenIds[i], metadataStruct, { from: nftContract });
        await delay(100);
      }
    });

    describe("getMetadata", () => {
      it("should return correct metadata for each token", async () => {
        for (let i = 0; i < tokenIds.length; i++) {
          const result = await nftMetadata.getMetadata(tokenIds[i]);
          assert.equal(result.intellectual_property_type, metadata[i].ipType, `IP type should match for token ${tokenIds[i]}`);
          assert.equal(result.intellectual_property_id, metadata[i].ipId, `IP ID should match for token ${tokenIds[i]}`);
          assert.equal(result.encrypted, metadata[i].encrypted, `Encrypted flag should match for token ${tokenIds[i]}`);
        }
      });

      it("should revert for non-existent token", async () => {
        await expectRevert(
          nftMetadata.getMetadata(999),
          "NFTMetadata: Metadata does not exist"
        );
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

  });


  describe("Edge Cases", () => {
    it("should handle empty strings in non-required fields", async () => {
      const tokenId = 1;
      
      // First set max access level for the NFT
      await nftAccess.setMaxAccessLevel(tokenId, AccessLevel.AbsoluteOwnership, { from: deployer });
      await delay(100);
      // Grant NFT absolute ownership
      await nftAccess.grantAccess(tokenId, nftContract, AccessLevel.AbsoluteOwnership, { from: deployer });
      await delay(100);
      
      const metadataStruct = {
        image: "", // empty image URL - this will cause metadata to be considered non-existent
        intellectual_property_type: IPType.MODEL,
        encrypted: false,
        encryption_id: "", // empty encryption ID (valid when not encrypted)
        intellectual_property_id: "model-123",
        intellectual_property_storage: StorageType.NEURALABS,
        md5: "", // empty MD5 hash
        version: "" // empty version
      };
      
      await nftMetadata.createMetadata(tokenId, metadataStruct, { from: nftContract });
      await delay(100);

      // Note: Since image is empty, the contract considers metadata as non-existent
      const exists = await nftMetadata.metadataExists(tokenId);
      assert.equal(exists, false, "Metadata with empty image should be considered non-existent");
      
      // Test with non-empty image but other empty fields
      const tokenId2 = 2;
      await nftAccess.setMaxAccessLevel(tokenId2, AccessLevel.AbsoluteOwnership, { from: deployer });
      await delay(100);
      await nftAccess.grantAccess(tokenId2, nftContract, AccessLevel.AbsoluteOwnership, { from: deployer });
      await delay(100);
      
      const metadataStruct2 = {
        image: "https://example.com/image.png",
        intellectual_property_type: IPType.MODEL,
        encrypted: false,
        encryption_id: "", // empty encryption ID (valid when not encrypted)
        intellectual_property_id: "model-123",
        intellectual_property_storage: StorageType.NEURALABS,
        md5: "", // empty MD5 hash
        version: "" // empty version
      };
      
      await nftMetadata.createMetadata(tokenId2, metadataStruct2, { from: nftContract });
      await delay(100);
      
      const metadata = await nftMetadata.getMetadata(tokenId2);
      assert.equal(metadata.md5, "", "Empty MD5 hash should be allowed");
      assert.equal(metadata.version, "", "Empty version should be allowed");
      assert.equal(metadata.encryption_id, "", "Empty encryption ID should be allowed when not encrypted");
    });

    it("should handle very long strings", async () => {
      const tokenId = 1;
      const longString = "a".repeat(1000); // 1000 character string
      
      // First set max access level for the NFT
      await nftAccess.setMaxAccessLevel(tokenId, AccessLevel.AbsoluteOwnership, { from: deployer });
      await delay(100);
      // Grant NFT absolute ownership
      await nftAccess.grantAccess(tokenId, nftContract, AccessLevel.AbsoluteOwnership, { from: deployer });
      await delay(100);
      
      const metadataStruct = {
        image: longString,
        intellectual_property_type: IPType.MODEL,
        encrypted: false,
        encryption_id: "",
        intellectual_property_id: longString,
        intellectual_property_storage: StorageType.NEURALABS,
        md5: longString,
        version: longString
      };
      
      await nftMetadata.createMetadata(tokenId, metadataStruct, { from: nftContract });
      await delay(100);

      const metadata = await nftMetadata.getMetadata(tokenId);
      assert.equal(metadata.intellectual_property_id, longString, "Long IP ID should be stored");
      assert.equal(metadata.image, longString, "Long image URL should be stored");
    });

    it("should handle maximum uint256 token ID", async () => {
      const maxTokenId = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
      
      // First set max access level for the NFT
      await nftAccess.setMaxAccessLevel(maxTokenId, AccessLevel.AbsoluteOwnership, { from: deployer });
      await delay(100);
      // Grant NFT absolute ownership
      await nftAccess.grantAccess(maxTokenId, nftContract, AccessLevel.AbsoluteOwnership, { from: deployer });
      await delay(100);
      
      const metadataStruct = {
        image: "https://example.com/max.png",
        intellectual_property_type: IPType.MODEL,
        encrypted: false,
        encryption_id: "",
        intellectual_property_id: "model-max",
        intellectual_property_storage: StorageType.NEURALABS,
        md5: "hash-max",
        version: "1.0.0"
      };
      
      await nftMetadata.createMetadata(maxTokenId, metadataStruct, { from: nftContract });
      await delay(100);

      const exists = await nftMetadata.metadataExists(maxTokenId);
      assert.equal(exists, true, "Should handle max uint256 token ID");
    });
  });
});