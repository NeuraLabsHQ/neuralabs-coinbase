const UserAgentWallet = artifacts.require("UserAgentWallet");
const truffleAssert = require('truffle-assertions');

contract("UserAgentWallet", (accounts) => {
    let userAgentWallet;
    const userWallet = accounts[0];
    const agentWallet1 = accounts[1];
    const agentWallet2 = accounts[2];
    const otherUser = accounts[3];
    const otherAgentWallet = accounts[4];

    beforeEach(async () => {
        userAgentWallet = await UserAgentWallet.new();
    });

    // Helper function to create a signature
    const createSignature = async (userAddr, agentAddr, signerAccount) => {
        const message = `I authorize ${userAddr.toLowerCase()} as the owner of agent wallet ${agentAddr.toLowerCase()}`;
        const messageHash = web3.utils.soliditySha3(message);
        const signature = await web3.eth.sign(messageHash, signerAccount);
        return signature;
    };

    describe("Registration", () => {
        it("should register an agent wallet successfully", async () => {
            const signature = await createSignature(userWallet, agentWallet1, agentWallet1);
            
            const tx = await userAgentWallet.registerAgentWallet(signature, agentWallet1, { from: userWallet });
            
            // Check events
            truffleAssert.eventEmitted(tx, 'AgentWalletRegistered', (ev) => {
                return ev.userWallet === userWallet && ev.agentWallet === agentWallet1;
            });
            
            // Verify mappings
            const registeredAgent = await userAgentWallet.getAgentWallet(userWallet);
            assert.equal(registeredAgent, agentWallet1, "Agent wallet not mapped correctly");
            
            const registeredUser = await userAgentWallet.getUserWallet(agentWallet1);
            assert.equal(registeredUser, userWallet, "User wallet not reverse mapped correctly");
            
            // Check helper functions
            assert.equal(await userAgentWallet.hasAgentWallet(userWallet), true, "hasAgentWallet should return true");
            assert.equal(await userAgentWallet.isAgentWalletAssigned(agentWallet1), true, "isAgentWalletAssigned should return true");
        });

        it("should fail if agent wallet is zero address", async () => {
            const signature = await createSignature(userWallet, agentWallet1, agentWallet1);
            
            await truffleAssert.reverts(
                userAgentWallet.registerAgentWallet(signature, "0x0000000000000000000000000000000000000000", { from: userWallet }),
                "UserAgentWallet: Invalid agent wallet"
            );
        });

        it("should fail if user already has an agent wallet", async () => {
            const signature1 = await createSignature(userWallet, agentWallet1, agentWallet1);
            await userAgentWallet.registerAgentWallet(signature1, agentWallet1, { from: userWallet });
            
            const signature2 = await createSignature(userWallet, agentWallet2, agentWallet2);
            await truffleAssert.reverts(
                userAgentWallet.registerAgentWallet(signature2, agentWallet2, { from: userWallet }),
                "UserAgentWallet: User already has agent wallet"
            );
        });

        it("should fail if agent wallet is already assigned", async () => {
            const signature1 = await createSignature(userWallet, agentWallet1, agentWallet1);
            await userAgentWallet.registerAgentWallet(signature1, agentWallet1, { from: userWallet });
            
            const signature2 = await createSignature(otherUser, agentWallet1, agentWallet1);
            await truffleAssert.reverts(
                userAgentWallet.registerAgentWallet(signature2, agentWallet1, { from: otherUser }),
                "UserAgentWallet: Agent wallet already assigned"
            );
        });

        it("should fail with invalid signature", async () => {
            // Create signature with wrong signer
            const signature = await createSignature(userWallet, agentWallet1, userWallet);
            
            await truffleAssert.reverts(
                userAgentWallet.registerAgentWallet(signature, agentWallet1, { from: userWallet }),
                "UserAgentWallet: Invalid signature"
            );
        });

        it("should fail with malformed signature", async () => {
            const malformedSignature = "0x1234567890";
            
            await truffleAssert.reverts(
                userAgentWallet.registerAgentWallet(malformedSignature, agentWallet1, { from: userWallet }),
                "UserAgentWallet: Invalid signature length"
            );
        });
    });

    describe("Update", () => {
        beforeEach(async () => {
            const signature = await createSignature(userWallet, agentWallet1, agentWallet1);
            await userAgentWallet.registerAgentWallet(signature, agentWallet1, { from: userWallet });
        });

        it("should update agent wallet successfully", async () => {
            const signature = await createSignature(userWallet, agentWallet2, agentWallet2);
            
            const tx = await userAgentWallet.updateAgentWallet(signature, agentWallet2, { from: userWallet });
            
            // Check events
            truffleAssert.eventEmitted(tx, 'AgentWalletUpdated', (ev) => {
                return ev.userWallet === userWallet && 
                       ev.oldAgentWallet === agentWallet1 && 
                       ev.newAgentWallet === agentWallet2;
            });
            
            // Verify new mappings
            const registeredAgent = await userAgentWallet.getAgentWallet(userWallet);
            assert.equal(registeredAgent, agentWallet2, "New agent wallet not mapped correctly");
            
            const registeredUser = await userAgentWallet.getUserWallet(agentWallet2);
            assert.equal(registeredUser, userWallet, "User wallet not reverse mapped correctly");
            
            // Verify old mapping is removed
            const oldUser = await userAgentWallet.getUserWallet(agentWallet1);
            assert.equal(oldUser, "0x0000000000000000000000000000000000000000", "Old agent wallet mapping not removed");
        });

        it("should fail if new agent wallet is zero address", async () => {
            const signature = await createSignature(userWallet, agentWallet2, agentWallet2);
            
            await truffleAssert.reverts(
                userAgentWallet.updateAgentWallet(signature, "0x0000000000000000000000000000000000000000", { from: userWallet }),
                "UserAgentWallet: Invalid agent wallet"
            );
        });

        it("should fail if user has no existing agent wallet", async () => {
            const signature = await createSignature(otherUser, agentWallet2, agentWallet2);
            
            await truffleAssert.reverts(
                userAgentWallet.updateAgentWallet(signature, agentWallet2, { from: otherUser }),
                "UserAgentWallet: No existing agent wallet"
            );
        });

        it("should fail if new agent wallet is already assigned", async () => {
            // Register another user with agentWallet2
            const signature1 = await createSignature(otherUser, agentWallet2, agentWallet2);
            await userAgentWallet.registerAgentWallet(signature1, agentWallet2, { from: otherUser });
            
            // Try to update first user to agentWallet2
            const signature2 = await createSignature(userWallet, agentWallet2, agentWallet2);
            await truffleAssert.reverts(
                userAgentWallet.updateAgentWallet(signature2, agentWallet2, { from: userWallet }),
                "UserAgentWallet: New agent wallet already assigned"
            );
        });

        it("should fail with invalid signature", async () => {
            // Create signature with wrong signer
            const signature = await createSignature(userWallet, agentWallet2, userWallet);
            
            await truffleAssert.reverts(
                userAgentWallet.updateAgentWallet(signature, agentWallet2, { from: userWallet }),
                "UserAgentWallet: Invalid signature"
            );
        });
    });

    describe("Query Functions", () => {
        it("should return correct mappings when registered", async () => {
            const signature = await createSignature(userWallet, agentWallet1, agentWallet1);
            await userAgentWallet.registerAgentWallet(signature, agentWallet1, { from: userWallet });
            
            assert.equal(await userAgentWallet.getAgentWallet(userWallet), agentWallet1);
            assert.equal(await userAgentWallet.getUserWallet(agentWallet1), userWallet);
            assert.equal(await userAgentWallet.hasAgentWallet(userWallet), true);
            assert.equal(await userAgentWallet.isAgentWalletAssigned(agentWallet1), true);
        });

        it("should return zero values for unregistered addresses", async () => {
            assert.equal(await userAgentWallet.getAgentWallet(userWallet), "0x0000000000000000000000000000000000000000");
            assert.equal(await userAgentWallet.getUserWallet(agentWallet1), "0x0000000000000000000000000000000000000000");
            assert.equal(await userAgentWallet.hasAgentWallet(userWallet), false);
            assert.equal(await userAgentWallet.isAgentWalletAssigned(agentWallet1), false);
        });
    });

    describe("Multiple User Scenarios", () => {
        it("should handle multiple users with different agent wallets", async () => {
            // Register first user
            const signature1 = await createSignature(userWallet, agentWallet1, agentWallet1);
            await userAgentWallet.registerAgentWallet(signature1, agentWallet1, { from: userWallet });
            
            // Register second user
            const signature2 = await createSignature(otherUser, agentWallet2, agentWallet2);
            await userAgentWallet.registerAgentWallet(signature2, agentWallet2, { from: otherUser });
            
            // Verify both mappings exist independently
            assert.equal(await userAgentWallet.getAgentWallet(userWallet), agentWallet1);
            assert.equal(await userAgentWallet.getAgentWallet(otherUser), agentWallet2);
            assert.equal(await userAgentWallet.getUserWallet(agentWallet1), userWallet);
            assert.equal(await userAgentWallet.getUserWallet(agentWallet2), otherUser);
        });

        it("should allow users to update to previously used agent wallets", async () => {
            // Register and update first user
            const signature1 = await createSignature(userWallet, agentWallet1, agentWallet1);
            await userAgentWallet.registerAgentWallet(signature1, agentWallet1, { from: userWallet });
            
            const signature2 = await createSignature(userWallet, agentWallet2, agentWallet2);
            await userAgentWallet.updateAgentWallet(signature2, agentWallet2, { from: userWallet });
            
            // Now agentWallet1 is free, another user should be able to use it
            const signature3 = await createSignature(otherUser, agentWallet1, agentWallet1);
            await userAgentWallet.registerAgentWallet(signature3, agentWallet1, { from: otherUser });
            
            assert.equal(await userAgentWallet.getAgentWallet(otherUser), agentWallet1);
            assert.equal(await userAgentWallet.getUserWallet(agentWallet1), otherUser);
        });
    });
});