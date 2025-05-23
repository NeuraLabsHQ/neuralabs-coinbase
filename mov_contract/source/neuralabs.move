// Copyright (c) 2024, NeuraLabs
// SPDX-License-Identifier: Apache-2.0

/// NFT Contract with Seal integration for encrypted data storage on Walrus
/// This contract manages NFT-based access control for AI workflows with 6 levels of access.
/// Level 4 and above can decrypt files stored on Walrus using Seal threshold encryption.
module neuralnft::nft {
    use std::string::{Self, String};
    use sui::clock::Clock;
    use sui::table::{Self, Table};
    use sui::dynamic_field as df;
    use sui::event;
    use sui::vec_map::{Self, VecMap};
    
    // Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_NFT_DOES_NOT_EXIST: u64 = 2;
    const E_INVALID_ACCESS_LEVEL: u64 = 3;
    const E_INSUFFICIENT_ACCESS: u64 = 4;
    const E_ALREADY_EXISTS: u64 = 5;
    const E_INVALID_CAP: u64 = 6;
    
    // Access levels
    const ACCESS_NONE: u8 = 0;
    const ACCESS_USE_MODEL: u8 = 1;
    const ACCESS_RESALE: u8 = 2;
    const ACCESS_CREATE_REPLICA: u8 = 3;
    const ACCESS_VIEW_DOWNLOAD: u8 = 4;  // Minimum level for decryption
    const ACCESS_EDIT_DATA: u8 = 5;
    const ACCESS_ABSOLUTE_OWNERSHIP: u8 = 6;
    
    // Marker for dynamic fields
    const ENCRYPTED_DATA_MARKER: u64 = 1;
    
    /// NFT Object representing an AI workflow
    public struct NFT has key, store {
        id: UID,
        name: String,
        description: String,
        creator: address,
        current_owner: address,
        creation_date: u64,
        level_of_ownership: u8,
        // Token ID for internal tracking
        token_id: u64,
        // Dynamic fields will store encrypted data references
    }
    
    /// NFT Collection - manages all NFTs and access control
    public struct NFTCollection has key {
        id: UID,
        next_token_id: u64,
        // Maps user address -> token_id -> access_level
        access_rights: Table<address, Table<u64, u8>>,
        // Maps token_id -> default access level for new users
        default_access_levels: Table<u64, u8>,
    }
    
    /// Admin capability for the collection
    public struct CollectionCap has key {
        id: UID,
        collection_id: ID,
    }
    
    /// Encrypted data stored on Walrus with Seal integration
    public struct EncryptedData has store, copy, drop {
        walrus_blob_id: String,
        seal_encrypted_key_id: vector<u8>,
        encryption_metadata: String, // JSON metadata about encryption
        file_hash: String,
        file_size: u64,
        content_type: String,
        encryption_threshold: u8, // t-out-of-n threshold
        key_server_count: u8,     // n key servers used
    }
    
    // Events
    public struct NFTCreated has copy, drop {
        token_id: u64,
        name: String,
        creator: address,
        owner: address,
        timestamp: u64,
    }
    
    public struct NFTTransferred has copy, drop {
        token_id: u64,
        from: address,
        to: address,
        timestamp: u64,
    }
    
    public struct AccessGranted has copy, drop {
        token_id: u64,
        user: address,
        access_level: u8,
        granted_by: address,
        timestamp: u64,
    }
    
    public struct AccessRevoked has copy, drop {
        token_id: u64,
        user: address,
        revoked_by: address,
        timestamp: u64,
    }
    
    public struct EncryptedDataAdded has copy, drop {
        token_id: u64,
        walrus_blob_id: String,
        added_by: address,
        timestamp: u64,
    }
    
    /// Initialize the NFT collection
    public fun create_collection(ctx: &mut TxContext): CollectionCap {
        let collection = NFTCollection {
            id: object::new(ctx),
            next_token_id: 1,
            access_rights: table::new(ctx),
            default_access_levels: table::new(ctx),
        };
        
        let cap = CollectionCap {
            id: object::new(ctx),
            collection_id: object::id(&collection),
        };
        
        transfer::share_object(collection);
        cap
    }
    
    /// Create a new NFT
    public fun create_nft(
        collection: &mut NFTCollection,
        name: String,
        description: String,
        level_of_ownership: u8,
        clock: &Clock,
        ctx: &mut TxContext
    ): u64 {
        assert!(level_of_ownership >= 1 && level_of_ownership <= 6, E_INVALID_ACCESS_LEVEL);
        
        let creator = ctx.sender();
        let token_id = collection.next_token_id;
        collection.next_token_id = collection.next_token_id + 1;
        
        let nft = NFT {
            id: object::new(ctx),
            name: name,
            description: description,
            creator: creator,
            current_owner: creator,
            creation_date: clock.timestamp_ms(),
            level_of_ownership,
            token_id,
        };
        
        // Grant absolute ownership to creator
        grant_access_internal(collection, creator, token_id, ACCESS_ABSOLUTE_OWNERSHIP);
        
        // Emit creation event
        event::emit(NFTCreated {
            token_id,
            name: nft.name,
            creator,
            owner: creator,
            timestamp: clock.timestamp_ms(),
        });
        
        transfer::public_transfer(nft, creator);
        token_id
    }
    
    /// Transfer NFT to another address
    public fun transfer_nft(
        collection: &mut NFTCollection,
        nft: NFT,
        recipient: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        assert!(nft.current_owner == sender, E_NOT_AUTHORIZED);
        
        let token_id = get_token_id_from_nft(&nft);
        
        // Update ownership in the NFT object
        let NFT {
            id,
            name,
            description,
            creator,
            current_owner: _,
            creation_date,
            level_of_ownership,
            token_id,
        } = nft;
        
        let updated_nft = NFT {
            id,
            name,
            description,
            creator,
            current_owner: recipient,
            creation_date,
            level_of_ownership,
            token_id,
        };
        
        // Transfer access rights
        let current_access = get_access_level(collection, sender, token_id);
        if (current_access > ACCESS_NONE) {
            revoke_access_internal(collection, sender, token_id);
            grant_access_internal(collection, recipient, token_id, current_access);
        };
        
        // Emit transfer event
        event::emit(NFTTransferred {
            token_id,
            from: sender,
            to: recipient,
            timestamp: clock.timestamp_ms(),
        });
        
        transfer::public_transfer(updated_nft, recipient);
    }
    
    /// Grant access to a user for a specific NFT
    public fun grant_access(
        collection: &mut NFTCollection,
        token_id: u64,
        user: address,
        access_level: u8,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        assert!(access_level >= 1 && access_level <= 6, E_INVALID_ACCESS_LEVEL);
        
        // Check if sender has sufficient privileges (must have absolute ownership)
        let sender_access = get_access_level(collection, sender, token_id);
        assert!(sender_access == ACCESS_ABSOLUTE_OWNERSHIP, E_NOT_AUTHORIZED);
        
        grant_access_internal(collection, user, token_id, access_level);
        
        // Emit access granted event
        event::emit(AccessGranted {
            token_id,
            user,
            access_level,
            granted_by: sender,
            timestamp: clock.timestamp_ms(),
        });
    }
    
    /// Revoke access from a user
    public fun revoke_access(
        collection: &mut NFTCollection,
        token_id: u64,
        user: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        
        // Check if sender has sufficient privileges
        let sender_access = get_access_level(collection, sender, token_id);
        assert!(sender_access == ACCESS_ABSOLUTE_OWNERSHIP, E_NOT_AUTHORIZED);
        
        revoke_access_internal(collection, user, token_id);
        
        // Emit access revoked event
        event::emit(AccessRevoked {
            token_id,
            user,
            revoked_by: sender,
            timestamp: clock.timestamp_ms(),
        });
    }
    
    /// Add encrypted data to an NFT (stores reference to Walrus blob)
    public fun add_encrypted_data(
        nft: &mut NFT,
        collection: &mut NFTCollection,
        walrus_blob_id: String,
        seal_encrypted_key_id: vector<u8>,
        encryption_metadata: String,
        file_hash: String,
        file_size: u64,
        content_type: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        let token_id = get_token_id_from_nft(nft);
        
        // Check if sender has edit access or absolute ownership
        let access_level = get_access_level(collection, sender, token_id);
        assert!(
            access_level >= ACCESS_EDIT_DATA || access_level == ACCESS_ABSOLUTE_OWNERSHIP, 
            E_INSUFFICIENT_ACCESS
        );
        
        let encrypted_data = EncryptedData {
            walrus_blob_id: walrus_blob_id,
            seal_encrypted_key_id,
            encryption_metadata,
            file_hash,
            file_size,
            content_type,
            encryption_threshold: 1, // Default to 1-out-of-n
            key_server_count: 2,     // Default to 2 key servers
        };
        
        // Store encrypted data as dynamic field
        let field_name = string::utf8(b"encrypted_data_");
        string::append(&mut field_name, walrus_blob_id);
        
        df::add(&mut nft.id, field_name, encrypted_data);
        
        // Emit event
        event::emit(EncryptedDataAdded {
            token_id,
            walrus_blob_id: encrypted_data.walrus_blob_id,
            added_by: sender,
            timestamp: clock.timestamp_ms(),
        });
    }
    
    /// Check if user can decrypt files (needs ACCESS_VIEW_DOWNLOAD or higher)
    public fun can_decrypt_files(
        collection: &NFTCollection,
        token_id: u64,
        user: address
    ): bool {
        let access_level = get_access_level(collection, user, token_id);
        access_level >= ACCESS_VIEW_DOWNLOAD
    }
    
    /// Set default access level for new users
    public fun set_default_access_level(
        collection: &mut NFTCollection,
        token_id: u64,
        access_level: u8,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        assert!(access_level <= 6, E_INVALID_ACCESS_LEVEL);
        
        // Check authorization
        let sender_access = get_access_level(collection, sender, token_id);
        assert!(sender_access == ACCESS_ABSOLUTE_OWNERSHIP, E_NOT_AUTHORIZED);
        
        if (table::contains(&collection.default_access_levels, token_id)) {
            *table::borrow_mut(&mut collection.default_access_levels, token_id) = access_level;
        } else {
            table::add(&mut collection.default_access_levels, token_id, access_level);
        };
    }
    
    /// Seal approve function for decryption access
    /// This follows the Seal pattern for access control
    /// The id format should be: [token_id][nonce] where token_id is 8 bytes
    entry fun seal_approve(
        id: vector<u8>,
        collection: &NFTCollection,
        ctx: &TxContext
    ) {
        let user = ctx.sender();
        
        // Extract token_id from the id (first 8 bytes)
        assert!(vector::length(&id) >= 8, E_INVALID_ACCESS_LEVEL);
        let token_id_bytes = vector::slice(&id, 0, 8);
        let token_id = bytes_to_u64(token_id_bytes);
        
        // Check if user has sufficient access for decryption (level 4 or above)
        assert!(can_decrypt_files(collection, token_id, user), E_INSUFFICIENT_ACCESS);
    }
    
    /// Alternative seal approve function for multiple file access
    entry fun seal_approve_batch(
        ids: vector<vector<u8>>,
        collection: &NFTCollection,
        ctx: &TxContext
    ) {
        let user = ctx.sender();
        let i = 0;
        let len = vector::length(&ids);
        
        while (i < len) {
            let id = vector::borrow(&ids, i);
            assert!(vector::length(id) >= 8, E_INVALID_ACCESS_LEVEL);
            let token_id_bytes = vector::slice(id, 0, 8);
            let token_id = bytes_to_u64(token_id_bytes);
            assert!(can_decrypt_files(collection, token_id, user), E_INSUFFICIENT_ACCESS);
            i = i + 1;
        };
    }
    
    // ===== Internal helper functions =====
    
    fun grant_access_internal(
        collection: &mut NFTCollection,
        user: address,
        token_id: u64,
        access_level: u8
    ) {
        if (!table::contains(&collection.access_rights, user)) {
            table::add(&mut collection.access_rights, user, table::new());
        };
        
        let user_rights = table::borrow_mut(&mut collection.access_rights, user);
        
        if (table::contains(user_rights, token_id)) {
            *table::borrow_mut(user_rights, token_id) = access_level;
        } else {
            table::add(user_rights, token_id, access_level);
        };
    }
    
    fun revoke_access_internal(
        collection: &mut NFTCollection,
        user: address,
        token_id: u64
    ) {
        if (table::contains(&collection.access_rights, user)) {
            let user_rights = table::borrow_mut(&mut collection.access_rights, user);
            if (table::contains(user_rights, token_id)) {
                table::remove(user_rights, token_id);
            };
        };
    }
    
    // ===== View functions =====
    
    public fun get_access_level(
        collection: &NFTCollection,
        user: address,
        token_id: u64
    ): u8 {
        if (table::contains(&collection.access_rights, user)) {
            let user_rights = table::borrow(&collection.access_rights, user);
            if (table::contains(user_rights, token_id)) {
                return *table::borrow(user_rights, token_id)
            };
        };
        
        // Return default access level if exists
        if (table::contains(&collection.default_access_levels, token_id)) {
            *table::borrow(&collection.default_access_levels, token_id)
        } else {
            ACCESS_NONE
        }
    }
    
    public fun get_nft_info(nft: &NFT): (String, String, address, address, u64, u8, u64) {
        (
            nft.name,
            nft.description,
            nft.creator,
            nft.current_owner,
            nft.creation_date,
            nft.level_of_ownership,
            nft.token_id
        )
    }
    
    public fun get_encrypted_data(
        nft: &NFT,
        walrus_blob_id: String
    ): &EncryptedData {
        let field_name = string::utf8(b"encrypted_data_");
        string::append(&mut field_name, walrus_blob_id);
        df::borrow(&nft.id, field_name)
    }
    
    public fun get_all_encrypted_data_keys(nft: &NFT): vector<String> {
        // This is a simplified version - in production you'd iterate through dynamic fields
        vector::empty<String>()
    }
    
    fun get_token_id_from_nft(nft: &NFT): u64 {
        nft.token_id
    }
    
    /// Convert 8 bytes to u64 (big-endian)
    fun bytes_to_u64(bytes: vector<u8>): u64 {
        assert!(vector::length(&bytes) == 8, E_INVALID_ACCESS_LEVEL);
        let result = 0u64;
        let i = 0;
        while (i < 8) {
            result = (result << 8) | (*vector::borrow(&bytes, i) as u64);
            i = i + 1;
        };
        result
    }
    
    /// Convert u64 to 8 bytes (big-endian)
    public fun u64_to_bytes(value: u64): vector<u8> {
        let bytes = vector::empty<u8>();
        let i = 0;
        while (i < 8) {
            vector::push_back(&mut bytes, ((value >> (56 - i * 8)) & 0xFF) as u8);
            i = i + 1;
        };
        bytes
    }
    
    /// Generate namespace for Seal encryption based on token_id
    public fun get_seal_namespace(token_id: u64): vector<u8> {
        u64_to_bytes(token_id)
    }
    
    // ===== Test-only functions =====
    
    #[test_only]
    public fun destroy_for_testing(collection: NFTCollection, cap: CollectionCap) {
        let NFTCollection { 
            id, 
            next_token_id: _,
            access_rights,
            default_access_levels,
        } = collection;
        object::delete(id);
        
        // Destroy all inner tables in access_rights
        let keys = table::keys(&access_rights);
        let i = 0;
        while (i < vector::length(&keys)) {
            let key = vector::borrow(&keys, i);
            let inner_table = table::remove(&mut access_rights, *key);
            table::drop(inner_table);
            i = i + 1;
        };
        table::destroy_empty(access_rights);
        table::destroy_empty(default_access_levels);
        
        let CollectionCap { id, collection_id: _ } = cap;
        object::delete(id);
    }
    
    #[test_only]
    public fun create_test_nft(
        collection: &mut NFTCollection,
        name: String,
        description: String,
        clock: &Clock,
        ctx: &mut TxContext
    ): NFT {
        let creator = ctx.sender();
        let token_id = collection.next_token_id;
        collection.next_token_id = collection.next_token_id + 1;
        
        let nft = NFT {
            id: object::new(ctx),
            name,
            description,
            creator,
            current_owner: creator,
            creation_date: clock.timestamp_ms(),
            level_of_ownership: ACCESS_ABSOLUTE_OWNERSHIP,
            token_id: 0, // Test token id
        };
        
        grant_access_internal(collection, creator, token_id, ACCESS_ABSOLUTE_OWNERSHIP);
        nft
    }
}