// Copyright (c) 2024, NeuraLabs
// SPDX-License-Identifier: Apache-2.0

/// Storage module for Walrus integration with encrypted data
module neuralabs::storage;

use std::string::String;
use sui::dynamic_field as df;
use neuralabs::nft::NeuraLabsNFT;
use neuralabs::access::AccessRegistry;

// Errors
const EInsufficientAccess: u64 = 0;
const EDataNotFound: u64 = 1;

// Marker constant for simple blob publishing (following MystenLabs pattern)
const MARKER: u64 = 3;

/// Encrypted data stored on Walrus
public struct EncryptedData has store, copy, drop {
    walrus_blob_id: String,
    seal_key_id: vector<u8>,
    file_hash: String,
    file_size: u64,
    content_type: String,
    encrypted_at: u64,
}

/// Event emitted when data is uploaded
public struct DataUploaded has copy, drop {
    nft_id: ID,
    walrus_blob_id: String,
    uploader: address,
    timestamp: u64,
}

/// Attach encrypted data to an NFT
public fun add_encrypted_data(
    nft: &mut NeuraLabsNFT,
    registry: &AccessRegistry,
    walrus_blob_id: String,
    seal_key_id: vector<u8>,
    file_hash: String,
    file_size: u64,
    content_type: String,
    clock: &sui::clock::Clock,
    ctx: &mut TxContext
) {
    let user = ctx.sender();
    let nft_id = neuralabs::nft::get_nft_id(nft);
    
    // Check if user has edit access (level 5+) or is creator
    let access_level = neuralabs::access::get_access_level(registry, nft_id, user);
    let (_, _, creator, _) = neuralabs::nft::get_info(nft);
    assert!(access_level >= 5 || user == creator, EInsufficientAccess);

    let encrypted_data = EncryptedData {
        walrus_blob_id,
        seal_key_id,
        file_hash,
        file_size,
        content_type,
        encrypted_at: clock.timestamp_ms(),
    };

    // Store as dynamic field using blob_id as key
    df::add(neuralabs::nft::uid_mut(nft), walrus_blob_id, encrypted_data);

    // Emit event
    sui::event::emit(DataUploaded {
        nft_id,
        walrus_blob_id: encrypted_data.walrus_blob_id,
        uploader: user,
        timestamp: encrypted_data.encrypted_at,
    });
}

/// Get encrypted data by blob ID
public fun get_encrypted_data(
    nft: &NeuraLabsNFT,
    walrus_blob_id: String
): &EncryptedData {
    assert!(df::exists_(neuralabs::nft::uid(nft), walrus_blob_id), EDataNotFound);
    df::borrow(neuralabs::nft::uid(nft), walrus_blob_id)
}

/// Check if encrypted data exists
public fun has_encrypted_data(
    nft: &NeuraLabsNFT,
    walrus_blob_id: String
): bool {
    df::exists_(neuralabs::nft::uid(nft), walrus_blob_id)
}

/// Remove encrypted data (only for high access users)
public fun remove_encrypted_data(
    nft: &mut NeuraLabsNFT,
    registry: &AccessRegistry,
    walrus_blob_id: String,
    ctx: &TxContext
): EncryptedData {
    let user = ctx.sender();
    let nft_id = neuralabs::nft::get_nft_id(nft);
    
    // Check if user has edit access (level 5+) or is creator
    let access_level = neuralabs::access::get_access_level(registry, nft_id, user);
    let (_, _, creator, _) = neuralabs::nft::get_info(nft);
    assert!(access_level >= 5 || user == creator, EInsufficientAccess);

    df::remove(neuralabs::nft::uid_mut(nft), walrus_blob_id)
}

/// Entry function to add encrypted data
entry fun upload_encrypted_data(
    nft: &mut NeuraLabsNFT,
    registry: &AccessRegistry,
    walrus_blob_id: String,
    seal_key_id: vector<u8>,
    file_hash: String,
    file_size: u64,
    content_type: String,
    clock: &sui::clock::Clock,
    ctx: &mut TxContext
) {
    add_encrypted_data(
        nft,
        registry,
        walrus_blob_id,
        seal_key_id,
        file_hash,
        file_size,
        content_type,
        clock,
        ctx
    );
}

/// Get data info (read-only)
public fun get_data_info(data: &EncryptedData): (String, vector<u8>, String, u64, String, u64) {
    (
        data.walrus_blob_id,
        data.seal_key_id,
        data.file_hash,
        data.file_size,
        data.content_type,
        data.encrypted_at
    )
}

/// Publish encrypted blob to NFT (following MystenLabs pattern)
public fun publish(
    nft: &mut NeuraLabsNFT,
    registry: &AccessRegistry,
    blob_id: String,
    ctx: &TxContext
) {
    let user = ctx.sender();
    let nft_id = neuralabs::nft::get_nft_id(nft);
    
    // Check if user has edit access (level 5+) or is creator
    let access_level = neuralabs::access::get_access_level(registry, nft_id, user);
    let (_, _, creator, _) = neuralabs::nft::get_info(nft);
    assert!(access_level >= 5 || user == creator, EInsufficientAccess);
    
    // Simply add the blob_id as a dynamic field with MARKER value
    df::add(neuralabs::nft::uid_mut(nft), blob_id, MARKER);
}

/// Entry function for publish
entry fun publish_blob(
    nft: &mut NeuraLabsNFT,
    registry: &AccessRegistry,
    blob_id: String,
    ctx: &TxContext
) {
    publish(nft, registry, blob_id, ctx);
}

/// Check if a blob_id is published for this NFT
public fun is_published(
    nft: &NeuraLabsNFT,
    blob_id: String
): bool {
    df::exists_(neuralabs::nft::uid(nft), blob_id)
}
}