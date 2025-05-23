// Copyright (c) 2024, Your Name
// SPDX-License-Identifier: Apache-2.0

/// NFT Contract with Seal integration for encrypted data storage on Walrus
module neuralnft::nft {
    use std::string::{Self, String};
    use sui::clock::Clock;
    use sui::table::{Self, Table};
    use sui::dynamic_field as df;
    use sui::event;
    
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
    
    /// NFT Object
    public struct NFT has key, store {
        id: UID,
        name: String,
        description: String,
        creator: address,
        current_owner: address,
        creation_date: u64,
        level_of_ownership: u8,
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
    
    /// Encrypted data stored on Walrus
    public struct EncryptedData has store, copy, drop {
        walrus_blob_id: String,
        seal_encrypted_key_id: vector<u8>,
        encryption_metadata: String, // JSON metadata about encryption
        file_hash: String,
        file_size: u64,
        content_type: String,
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
        } = nft;
        
        let updated_nft = NFT {
            id,
            name,
            description,
            creator,
            current_owner: recipient,
            creation_date,
            level_of_ownership,
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
    entry fun seal_approve(
        collection: &NFTCollection,
        id: vector<u8>,
        token_id: u64,
        ctx: &TxContext
    ) {
        let user = ctx.sender();
        
        // Check if user has sufficient access for decryption
        assert!(can_decrypt_files(collection, token_id, user), E_INSUFFICIENT_ACCESS);
        
        // The id parameter should match the expected format for Seal encryption
        // Format: [package_id][token_id][nonce]
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
    
    public fun get_nft_info(nft: &NFT): (String, String, address, address, u64, u8) {
        (
            nft.name,
            nft.description,
            nft.creator,
            nft.current_owner,
            nft.creation_date,
            nft.level_of_ownership
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
    
    fun get_token_id_from_nft(_nft: &NFT): u64 {
        // In a real implementation, you'd extract this from the NFT object
        // For now, we'll use a placeholder
        0 // This should be implemented properly based on your needs
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
        };
        
        grant_access_internal(collection, creator, token_id, ACCESS_ABSOLUTE_OWNERSHIP);
        nft
    }
}