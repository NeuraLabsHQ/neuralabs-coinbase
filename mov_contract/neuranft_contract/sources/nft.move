// Copyright (c) 2024, NeuraLabs
// SPDX-License-Identifier: Apache-2.0

/// Simple NFT module for AI workflows with access control
module neuralabs::nft;

use std::string::String;

/// NFT representing an AI workflow with access control
public struct NeuraLabsNFT has key, store {
    id: UID,
    name: String,
    description: String,
    creator: address,
    created_at: u64,
}

/// Create a new NFT
public fun mint(
        name: String,
        description: String,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ): NeuraLabsNFT {
        NeuraLabsNFT {
            id: object::new(ctx),
            name,
            description,
            creator: ctx.sender(),
            created_at: clock.timestamp_ms(),
        }
    }

/// Entry function to mint NFT and transfer to sender
entry fun mint_to_sender(
        name: String,
        description: String,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
) {
    let nft = mint(name, description, clock, ctx);
    transfer::transfer(nft, ctx.sender());
}

/// Transfer NFT to another address
public fun transfer_nft(nft: NeuraLabsNFT, recipient: address) {
    transfer::transfer(nft, recipient);
}

/// Get NFT information
public fun get_info(nft: &NeuraLabsNFT): (String, String, address, u64) {
    (nft.name, nft.description, nft.creator, nft.created_at)
}

/// Get NFT ID for access control
public fun get_nft_id(nft: &NeuraLabsNFT): ID {
    object::id(nft)
}

/// Namespace for Seal integration 
public fun namespace(nft: &NeuraLabsNFT): vector<u8> {
    nft.id.to_bytes()
}

/// Get mutable reference to NFT UID (for storage module)
public(package) fun uid_mut(nft: &mut NeuraLabsNFT): &mut UID {
    &mut nft.id
}

/// Get reference to NFT UID (for storage module)
public(package) fun uid(nft: &NeuraLabsNFT): &UID {
    &nft.id
}

#[test_only]
public fun destroy_for_testing(nft: NeuraLabsNFT) {
    let NeuraLabsNFT { id, .. } = nft;
    object::delete(id);
}