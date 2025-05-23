// Copyright (c) 2024, NeuraLabs
// SPDX-License-Identifier: Apache-2.0

/// Utility functions for NeuraLabs NFT contract
module neuralabs::utils;

/// Returns true if `prefix` is a prefix of `word`
public fun is_prefix(prefix: vector<u8>, word: vector<u8>): bool {
    if (prefix.length() > word.length()) {
        return false
};
    
    let mut i = 0;
    while (i < prefix.length()) {
        if (prefix[i] != word[i]) {
            return false
        };
        i = i + 1;
};
    true
}

    /// Convert u64 to bytes (big-endian)
    public fun u64_to_bytes(value: u64): vector<u8> {
    let mut bytes = vector::empty<u8>();
    let mut i = 0;
    while (i < 8) {
        bytes.push_back(((value >> (56 - i * 8)) & 0xFF) as u8);
        i = i + 1;
};
    bytes
}

    /// Convert bytes to u64 (big-endian)
    public fun bytes_to_u64(bytes: vector<u8>): u64 {
    assert!(bytes.length() == 8, 0);
    let mut result = 0u64;
    let mut i = 0;
    while (i < 8) {
        result = (result << 8) | (bytes[i] as u64);
        i = i + 1;
};
    result
}

    /// Generate unique identifier for Seal encryption
    public fun generate_seal_id(nft_id: vector<u8>, nonce: u64): vector<u8> {
    let mut id = nft_id;
    let nonce_bytes = u64_to_bytes(nonce);
    id.append(nonce_bytes);
    id
}
}