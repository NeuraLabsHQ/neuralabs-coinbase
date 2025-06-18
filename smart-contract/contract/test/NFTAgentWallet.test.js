const MasterAccessControl = artifacts.require("MasterAccessControl");
const NFTAccessControl = artifacts.require("NFTAccessControl");
const NFTMetadata = artifacts.require("NFTMetadata");
const AIServiceAgreementManagement = artifacts.require("AIServiceAgreementManagement");
const NFTContract = artifacts.require("NFTContract");
const Monetization = artifacts.require("Monetization");
const NFTAgentWallet = artifacts.require("NFTAgentWallet");
const truffleAssert = require('truffle-assertions');

contract("NFTAgentWallet", (accounts) => {
    let masterAccessControl;
    let nftAccessControl;
    let nftMetadata;
    let aiServiceAgreementManagement;
    let nftContract;
    let monetization;
    let nftAgentWallet;
    
    const deployer = accounts[0];
    const nftOwner = accounts[1];
    const agentWallet1 = accounts[2];
    const agentWallet2 = accounts[3];
    const otherUser = accounts[4];
    const userWithAccess6 = accounts[5];
    const subscriptionHandler = accounts[6];
    
    let nftId1;
    let nftId2;

    // Helper function to create a signature
    const createSignature = async (nftId, agentAddr, signerAccount) => {
        const message = `I authorize NFT ID ${nftId} to be connected with agent wallet ${agentAddr.toLowerCase()}`;
        const messageHash = web3.utils.soliditySha3(message);
        const signature = await web3.eth.sign(messageHash, signerAccount);
        return signature;
    };

    beforeEach(async () => {
        // Deploy all contracts
        masterAccessControl = await MasterAccessControl.new({ from: deployer });
        nftAccessControl = await NFTAccessControl.new(masterAccessControl.address, { from: deployer });
        nftMetadata = await NFTMetadata.new(masterAccessControl.address, nftAccessControl.address, { from: deployer });
        aiServiceAgreementManagement = await AIServiceAgreementManagement.new(
            masterAccessControl.address,
            nftAccessControl.address,
            { from: deployer }
        );
        nftContract = await NFTContract.new(
            masterAccessControl.address,
            nftAccessControl.address,
            nftMetadata.address,
            "0x0000000000000000000000000000000000000000", // Monetization will be set later
            { from: deployer }
        );
        monetization = await Monetization.new(
            masterAccessControl.address,
            nftContract.address,
            nftAccessControl.address,
            nftMetadata.address,
            aiServiceAgreementManagement.address,
            { from: deployer }
        );
        nftAgentWallet = await NFTAgentWallet.new(masterAccessControl.address, { from: deployer });

        // Set up contract references
        await nftAccessControl.setAIServiceAgreementManagement(aiServiceAgreementManagement.address);
        await nftContract.setMonetizationContract(monetization.address);
        await monetization.setContractReferences(subscriptionHandler, nftAgentWallet.address);

        // Grant necessary permissions
        await masterAccessControl.grantAccess(nftAccessControl.address, nftContract.address);
        await masterAccessControl.grantAccess(nftAccessControl.address, monetization.address);
        await masterAccessControl.grantAccess(nftAccessControl.address, aiServiceAgreementManagement.address);
        await masterAccessControl.grantAccess(nftMetadata.address, nftContract.address);
        await masterAccessControl.grantAccess(nftMetadata.address, monetization.address);
        await masterAccessControl.grantAccess(nftContract.address, monetization.address);
        await masterAccessControl.grantAccess(aiServiceAgreementManagement.address, monetization.address);
        await masterAccessControl.grantAccess(aiServiceAgreementManagement.address, nftAccessControl.address);
        await masterAccessControl.grantAccess(nftAgentWallet.address, monetization.address);

        // Create NFTs for testing
        await nftContract.createNFT("Test NFT 1", 6, { from: nftOwner });
        nftId1 = 1;
        await nftContract.createNFT("Test NFT 2", 6, { from: nftOwner });
        nftId2 = 2;

        // Grant access level 6 to userWithAccess6 for nftId1
        await nftAccessControl.grantAccess(nftId1, userWithAccess6, 6, { from: nftOwner });
    });

    describe("Registration through Monetization", () => {
        it("should register an agent wallet successfully when called by NFT owner", async () => {
            const signature = await createSignature(nftId1, agentWallet1, agentWallet1);
            
            await monetization.registerNFTAgentWallet(nftId1, signature, agentWallet1, { from: nftOwner });
            
            // Verify mappings
            const registeredAgent = await nftAgentWallet.getAgentWallet(nftId1);
            assert.equal(registeredAgent, agentWallet1, "Agent wallet not mapped correctly");
            
            const registeredNftId = await nftAgentWallet.getNFTId(agentWallet1);
            assert.equal(registeredNftId.toString(), nftId1.toString(), "NFT ID not reverse mapped correctly");
            
            // Check helper functions
            assert.equal(await nftAgentWallet.hasAgentWallet(nftId1), true, "hasAgentWallet should return true");
            assert.equal(await nftAgentWallet.isAgentWalletAssigned(agentWallet1), true, "isAgentWalletAssigned should return true");
        });

        it("should register an agent wallet successfully when called by user with access level 6", async () => {
            const signature = await createSignature(nftId1, agentWallet1, agentWallet1);
            
            await monetization.registerNFTAgentWallet(nftId1, signature, agentWallet1, { from: userWithAccess6 });
            
            // Verify mappings
            const registeredAgent = await nftAgentWallet.getAgentWallet(nftId1);
            assert.equal(registeredAgent, agentWallet1, "Agent wallet not mapped correctly");
        });

        it("should fail if called by user without proper access", async () => {
            const signature = await createSignature(nftId1, agentWallet1, agentWallet1);
            
            await truffleAssert.reverts(
                monetization.registerNFTAgentWallet(nftId1, signature, agentWallet1, { from: otherUser }),
                "Monetization: Caller must be NFT owner or have access level 6"
            );
        });

        it("should fail if NFT already has an agent wallet", async () => {
            const signature1 = await createSignature(nftId1, agentWallet1, agentWallet1);
            await monetization.registerNFTAgentWallet(nftId1, signature1, agentWallet1, { from: nftOwner });
            
            const signature2 = await createSignature(nftId1, agentWallet2, agentWallet2);
            await truffleAssert.reverts(
                monetization.registerNFTAgentWallet(nftId1, signature2, agentWallet2, { from: nftOwner }),
                "NFTAgentWallet: NFT already has agent wallet"
            );
        });

        it("should fail if agent wallet is already assigned to another NFT", async () => {
            const signature1 = await createSignature(nftId1, agentWallet1, agentWallet1);
            await monetization.registerNFTAgentWallet(nftId1, signature1, agentWallet1, { from: nftOwner });
            
            const signature2 = await createSignature(nftId2, agentWallet1, agentWallet1);
            await truffleAssert.reverts(
                monetization.registerNFTAgentWallet(nftId2, signature2, agentWallet1, { from: nftOwner }),
                "NFTAgentWallet: Agent wallet already assigned"
            );
        });

        it("should fail with invalid signature", async () => {
            // Create signature with wrong signer
            const signature = await createSignature(nftId1, agentWallet1, nftOwner);
            
            await truffleAssert.reverts(
                monetization.registerNFTAgentWallet(nftId1, signature, agentWallet1, { from: nftOwner }),
                "NFTAgentWallet: Invalid signature"
            );
        });
    });

    describe("Update through Monetization", () => {
        beforeEach(async () => {
            const signature = await createSignature(nftId1, agentWallet1, agentWallet1);
            await monetization.registerNFTAgentWallet(nftId1, signature, agentWallet1, { from: nftOwner });
        });

        it("should update agent wallet successfully when called by NFT owner", async () => {
            const signature = await createSignature(nftId1, agentWallet2, agentWallet2);
            
            await monetization.updateNFTAgentWallet(nftId1, signature, agentWallet2, { from: nftOwner });
            
            // Verify new mappings
            const registeredAgent = await nftAgentWallet.getAgentWallet(nftId1);
            assert.equal(registeredAgent, agentWallet2, "New agent wallet not mapped correctly");
            
            const registeredNftId = await nftAgentWallet.getNFTId(agentWallet2);
            assert.equal(registeredNftId.toString(), nftId1.toString(), "NFT ID not reverse mapped correctly");
            
            // Verify old mapping is removed
            const oldNftId = await nftAgentWallet.getNFTId(agentWallet1);
            assert.equal(oldNftId.toString(), "0", "Old agent wallet mapping not removed");
        });

        it("should update agent wallet successfully when called by user with access level 6", async () => {
            const signature = await createSignature(nftId1, agentWallet2, agentWallet2);
            
            await monetization.updateNFTAgentWallet(nftId1, signature, agentWallet2, { from: userWithAccess6 });
            
            // Verify new mappings
            const registeredAgent = await nftAgentWallet.getAgentWallet(nftId1);
            assert.equal(registeredAgent, agentWallet2, "New agent wallet not mapped correctly");
        });

        it("should fail if called by user without proper access", async () => {
            const signature = await createSignature(nftId1, agentWallet2, agentWallet2);
            
            await truffleAssert.reverts(
                monetization.updateNFTAgentWallet(nftId1, signature, agentWallet2, { from: otherUser }),
                "Monetization: Caller must be NFT owner or have access level 6"
            );
        });

        it("should fail if NFT has no existing agent wallet", async () => {
            const signature = await createSignature(nftId2, agentWallet2, agentWallet2);
            
            await truffleAssert.reverts(
                monetization.updateNFTAgentWallet(nftId2, signature, agentWallet2, { from: nftOwner }),
                "NFTAgentWallet: No existing agent wallet"
            );
        });

        it("should fail if new agent wallet is already assigned", async () => {
            // Register nftId2 with agentWallet2
            const signature1 = await createSignature(nftId2, agentWallet2, agentWallet2);
            await monetization.registerNFTAgentWallet(nftId2, signature1, agentWallet2, { from: nftOwner });
            
            // Try to update nftId1 to agentWallet2
            const signature2 = await createSignature(nftId1, agentWallet2, agentWallet2);
            await truffleAssert.reverts(
                monetization.updateNFTAgentWallet(nftId1, signature2, agentWallet2, { from: nftOwner }),
                "NFTAgentWallet: New agent wallet already assigned"
            );
        });
    });

    describe("Direct calls to NFTAgentWallet", () => {
        it("should fail when called directly by non-authorized address", async () => {
            const signature = await createSignature(nftId1, agentWallet1, agentWallet1);
            
            await truffleAssert.reverts(
                nftAgentWallet.registerAgentWallet(nftId1, signature, agentWallet1, { from: nftOwner }),
                "NFTAgentWallet: Caller not authorized"
            );
        });

        it("should succeed when called by authorized contract", async () => {
            // Grant access to deployer for testing
            await masterAccessControl.grantAccess(nftAgentWallet.address, deployer);
            
            const signature = await createSignature(nftId1, agentWallet1, agentWallet1);
            const tx = await nftAgentWallet.registerAgentWallet(nftId1, signature, agentWallet1, { from: deployer });
            
            // Check events
            truffleAssert.eventEmitted(tx, 'AgentWalletRegistered', (ev) => {
                return ev.nftId.toString() === nftId1.toString() && ev.agentWallet === agentWallet1;
            });
        });
    });

    describe("Query Functions", () => {
        it("should return correct mappings when registered", async () => {
            const signature = await createSignature(nftId1, agentWallet1, agentWallet1);
            await monetization.registerNFTAgentWallet(nftId1, signature, agentWallet1, { from: nftOwner });
            
            assert.equal(await nftAgentWallet.getAgentWallet(nftId1), agentWallet1);
            assert.equal((await nftAgentWallet.getNFTId(agentWallet1)).toString(), nftId1.toString());
            assert.equal(await nftAgentWallet.hasAgentWallet(nftId1), true);
            assert.equal(await nftAgentWallet.isAgentWalletAssigned(agentWallet1), true);
        });

        it("should return zero values for unregistered entries", async () => {
            assert.equal(await nftAgentWallet.getAgentWallet(nftId1), "0x0000000000000000000000000000000000000000");
            assert.equal((await nftAgentWallet.getNFTId(agentWallet1)).toString(), "0");
            assert.equal(await nftAgentWallet.hasAgentWallet(nftId1), false);
            assert.equal(await nftAgentWallet.isAgentWalletAssigned(agentWallet1), false);
        });
    });

    describe("Multiple NFT Scenarios", () => {
        it("should handle multiple NFTs with different agent wallets", async () => {
            // Register first NFT
            const signature1 = await createSignature(nftId1, agentWallet1, agentWallet1);
            await monetization.registerNFTAgentWallet(nftId1, signature1, agentWallet1, { from: nftOwner });
            
            // Register second NFT
            const signature2 = await createSignature(nftId2, agentWallet2, agentWallet2);
            await monetization.registerNFTAgentWallet(nftId2, signature2, agentWallet2, { from: nftOwner });
            
            // Verify both mappings exist independently
            assert.equal(await nftAgentWallet.getAgentWallet(nftId1), agentWallet1);
            assert.equal(await nftAgentWallet.getAgentWallet(nftId2), agentWallet2);
            assert.equal((await nftAgentWallet.getNFTId(agentWallet1)).toString(), nftId1.toString());
            assert.equal((await nftAgentWallet.getNFTId(agentWallet2)).toString(), nftId2.toString());
        });

        it("should allow NFTs to update to previously used agent wallets", async () => {
            // Register and update first NFT
            const signature1 = await createSignature(nftId1, agentWallet1, agentWallet1);
            await monetization.registerNFTAgentWallet(nftId1, signature1, agentWallet1, { from: nftOwner });
            
            const signature2 = await createSignature(nftId1, agentWallet2, agentWallet2);
            await monetization.updateNFTAgentWallet(nftId1, signature2, agentWallet2, { from: nftOwner });
            
            // Now agentWallet1 is free, another NFT should be able to use it
            const signature3 = await createSignature(nftId2, agentWallet1, agentWallet1);
            await monetization.registerNFTAgentWallet(nftId2, signature3, agentWallet1, { from: nftOwner });
            
            assert.equal(await nftAgentWallet.getAgentWallet(nftId2), agentWallet1);
            assert.equal((await nftAgentWallet.getNFTId(agentWallet1)).toString(), nftId2.toString());
        });
    });
});