// Copyright (c) 2024, NeuraLabs
// SPDX-License-Identifier: Apache-2.0

/// Access control module for NFT-based permissions
module neuralabs::access;

use sui::table::{Self, Table};
use neuralabs::nft::NeuraLabsNFT;
use neuralabs::utils::is_prefix;

// Access levels (1-6)
const ACCESS_USE_MODEL: u8 = 1;
const ACCESS_RESALE: u8 = 2;
const ACCESS_CREATE_REPLICA: u8 = 3;
const ACCESS_VIEW_DOWNLOAD: u8 = 4;  // Minimum level for Walrus decryption
const ACCESS_EDIT_DATA: u8 = 5;
const ACCESS_ABSOLUTE_OWNERSHIP: u8 = 6;

// Errors
const EInvalidAccessLevel: u64 = 0;
const ENotAuthorized: u64 = 1;
const ENoAccess: u64 = 2;

/// Access control registry - shared object
public struct AccessRegistry has key {
    id: UID,
    // Maps NFT ID -> (user address -> access level)
    permissions: Table<ID, Table<address, u8>>,
}

/// Admin capability for managing access
public struct AccessCap has key {
    id: UID,
    nft_id: ID,
}

/// Create access registry (call once)
public fun create_registry(ctx: &mut TxContext): AccessRegistry {
    AccessRegistry {
        id: object::new(ctx),
        permissions: table::new(ctx),
    }
}

/// Initialize access registry and share it
entry fun init_registry(ctx: &mut TxContext) {
    let registry = create_registry(ctx);
    transfer::share_object(registry);
}

/// Create access capability for NFT owner
public fun create_access_cap(nft: &NeuraLabsNFT, ctx: &mut TxContext): AccessCap {
    AccessCap {
        id: object::new(ctx),
        nft_id: object::id(nft),
    }
}

/// Grant access to a user for an NFT
public fun grant_access(
    registry: &mut AccessRegistry,
    cap: &AccessCap,
    nft_id: ID,
    user: address,
    access_level: u8,
    ctx: &mut TxContext
) {
    assert!(cap.nft_id == nft_id, ENotAuthorized);
    assert!(access_level >= 1 && access_level <= 6, EInvalidAccessLevel);

    // Initialize NFT permissions if not exists
    if (!table::contains(&registry.permissions, nft_id)) {
        table::add(&mut registry.permissions, nft_id, table::new(ctx));
    };

    let nft_permissions = table::borrow_mut(&mut registry.permissions, nft_id);
    
    if (table::contains(nft_permissions, user)) {
        *table::borrow_mut(nft_permissions, user) = access_level;
    } else {
        table::add(nft_permissions, user, access_level);
    };
}

/// Revoke access from a user
public fun revoke_access(
    registry: &mut AccessRegistry,
    cap: &AccessCap,
    nft_id: ID,
    user: address
) {
    assert!(cap.nft_id == nft_id, ENotAuthorized);

    if (table::contains(&registry.permissions, nft_id)) {
        let nft_permissions = table::borrow_mut(&mut registry.permissions, nft_id);
        if (table::contains(nft_permissions, user)) {
            table::remove(nft_permissions, user);
        };
    };
}

/// Check user's access level for an NFT
public fun get_access_level(
    registry: &AccessRegistry,
    nft_id: ID,
    user: address
): u8 {
    if (!table::contains(&registry.permissions, nft_id)) {
        return 0
    };

    let nft_permissions = table::borrow(&registry.permissions, nft_id);
    if (table::contains(nft_permissions, user)) {
        *table::borrow(nft_permissions, user)
    } else {
        0
    }
}

/// Check if user can download files (access level 4+)
public fun can_download(
    registry: &AccessRegistry,
    nft_id: ID,
    user: address
): bool {
    get_access_level(registry, nft_id, user) >= ACCESS_VIEW_DOWNLOAD
}

/// Seal approve function for Walrus decryption
/// ID format: [nft_id_bytes][nonce]
entry fun seal_approve(
    id: vector<u8>,
    nft: &NeuraLabsNFT,
    registry: &AccessRegistry,
    ctx: &TxContext
) {
    let user = ctx.sender();
    let nft_namespace = neuralabs::nft::namespace(nft);
    
    // Check if ID has the right prefix (NFT namespace)
    assert!(is_prefix(nft_namespace, id), ENoAccess);
    
    // Check if user has download access
    let nft_id = neuralabs::nft::get_nft_id(nft);
    assert!(can_download(registry, nft_id, user), ENoAccess);
}

/// Batch approve for multiple files
entry fun seal_approve_batch(
    ids: vector<vector<u8>>,
    nft: &NeuraLabsNFT,
    registry: &AccessRegistry,
    ctx: &TxContext
) {
    let user = ctx.sender();
    let nft_namespace = neuralabs::nft::namespace(nft);
    let nft_id = neuralabs::nft::get_nft_id(nft);
    
    // Check access once
    assert!(can_download(registry, nft_id, user), ENoAccess);
    
    // Verify all IDs have correct prefix
    let mut i = 0;
    while (i < ids.length()) {
        assert!(is_prefix(nft_namespace, ids[i]), ENoAccess);
        i = i + 1;
    };
}

#[test_only]
public fun destroy_for_testing(registry: AccessRegistry, cap: AccessCap) {
    let AccessRegistry { id, permissions } = registry;
    object::delete(id);
    table::destroy_empty(permissions);

    let AccessCap { id, .. } = cap;
    object::delete(id);
}
}