### How to use template.env to make .env file

The format in template.env is: 

```
# PostgreSQL Configuration
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=

# Redis Configuration
REDIS_PASSWORD=
```

1. Make an .env file in the folder where the template.env and copy the field from template.env to the make env file
2. then do `docker compose up -d` to start the docker container
3. then do `/notebooks/initiate.ipynb` to initialize the database


An example data for the Agent in the Details Page:

```json
  const defaultFlowData = {
    name: "Portfolio Manager",
    description:
      "An AI Blockchain driven portfolio management system that optimizes asset allocation and risk management in Aptos.",
    tags: ["AI", "Blockchain", "Deep Learning"],
    creationDate: "8 day ago (March-16-2025 07:15:39 UTC)",
    owner: "0x22b7e94bb08eb07d59d1a56345e572a5b4409563bc0c0c8fd3eec0ec0bea8d46",
    lastEdited: "0 day ago (March-23-2025 08:42:29 UTC)",
    license: "MIT",
    fork: "Original",
    socials: "X: @harshp_16 | GitHub: harshpoddar03",
    actions: "Edit | Chat | Visualize | Duplicate",
    deploymentStatus: "Active",
    md5: "e67044f2cc088c8f5c359faf3c21e7e1",
    version: "v0.3",
    publishedDate: "0 day ago (March-23-2025 08:42:49 UTC)",
    publishHash:
      "0x1c66d49cc66cdc29d45d93b8388acdd62079cf18713de64a84c5260ed40ba0bb",
    chain: "APTOS Testnet",
    chainId: "0x1",
    chainStatus: "Active",
    chainExplorer: "explorer.aptoslabs.com/?network=testnet",
    contractName: "NeuraSynthesis",
    contractVersion: "v0.01",
    contractId:
      "0x48b3475fd2c5d2ae55b80154ea006e6ed6ffb78c8e7dbfd14288168d7da3f7e6",
    nftId: "NFT-001",
    nftMintHash:
      "0x20dd388a619f40aaabc36da3314278d0ad763ceb814d838e9853cbe944159af3",
    myAccess: "Level 6",
    noOfAccess: "2",
    monetization: "None",
  };
```

Database Query will be like this:

```sql
-- First, ensure the chain exists in chain_details
INSERT INTO chain_details (chain_id, chain, chain_status, chain_explorer)
VALUES (
    '0x1', 
    'APTOS Testnet', 
    'Active', 
    'explorer.aptoslabs.com/?network=testnet'
)
ON CONFLICT (chain_id) DO UPDATE SET
    chain = 'APTOS Testnet',
    chain_status = 'Active',
    chain_explorer = 'explorer.aptoslabs.com/?network=testnet';

-- Ensure the contract exists in contract_details
INSERT INTO contract_details (contract_id, chain_id, contract_name, contract_version)
VALUES (
    '0x48b3475fd2c5d2ae55b80154ea006e6ed6ffb78c8e7dbfd14288168d7da3f7e6',
    '0x1',
    'NeuraSynthesis',
    'v0.01'
)
ON CONFLICT (contract_id) DO UPDATE SET
    chain_id = '0x1',
    contract_name = 'NeuraSynthesis',
    contract_version = 'v0.01';

-- Ensure user exists in user_auth
INSERT INTO user_auth (user_pub_key, email, chain_id)
VALUES (
    '0x22b7e94bb08eb07d59d1a56345e572a5b4409563bc0c0c8fd3eec0ec0bea8d46',
    NULL,  -- Email is optional and not provided in the data
    '0x1'
)
ON CONFLICT (user_pub_key) DO NOTHING;

-- Insert the agent
INSERT INTO agent (
    agent_id,
    creation_date,
    owner,
    status,
    tags,
    license,
    fork,
    socials,
    description,
    name,
    chain_id
)
VALUES (
    'PM-' || md5('Portfolio Manager' || '0x22b7e94bb08eb07d59d1a56345e572a5b4409563bc0c0c8fd3eec0ec0bea8d46'), -- Generate agent_id using hash
    TO_TIMESTAMP('March-16-2025 07:15:39', 'Month-DD-YYYY HH24:MI:SS'),
    '0x22b7e94bb08eb07d59d1a56345e572a5b4409563bc0c0c8fd3eec0ec0bea8d46',
    'Active',
    'AI, Blockchain, Deep Learning',
    'MIT',
    'Original',
    'X: @harshp_16 | GitHub: harshpoddar03',
    'An AI Blockchain driven portfolio management system that optimizes asset allocation and risk management in Aptos.',
    'Portfolio Manager',
    '0x1'
)
ON CONFLICT (agent_id) DO UPDATE SET
    status = 'Active',
    tags = 'AI, Blockchain, Deep Learning',
    license = 'MIT',
    fork = 'Original',
    socials = 'X: @harshp_16 | GitHub: harshpoddar03',
    description = 'An AI Blockchain driven portfolio management system that optimizes asset allocation and risk management in Aptos.',
    name = 'Portfolio Manager';

-- Create a variable to reference agent_id
DO $$
DECLARE
    agent_id_val TEXT := 'PM-' || md5('Portfolio Manager' || '0x22b7e94bb08eb07d59d1a56345e572a5b4409563bc0c0c8fd3eec0ec0bea8d46');
BEGIN
    -- Insert into published_agent
    INSERT INTO published_agent (agent_id, last_edited_time, workflow, md5)
    VALUES (
        agent_id_val,
        TO_TIMESTAMP('March-23-2025 08:42:29', 'Month-DD-YYYY HH24:MI:SS'),
        '{}',  -- Empty JSON object as workflow details aren't provided
        'e67044f2cc088c8f5c359faf3c21e7e1'
    )
    ON CONFLICT (agent_id) DO UPDATE SET
        last_edited_time = TO_TIMESTAMP('March-23-2025 08:42:29', 'Month-DD-YYYY HH24:MI:SS'),
        md5 = 'e67044f2cc088c8f5c359faf3c21e7e1';

    -- Insert blockchain data
    INSERT INTO blockchain_agent_data (
        agent_id,
        version,
        published_date,
        published_hash,
        contract_id,
        nft_id,
        nft_mint_trx_id
    )
    VALUES (
        agent_id_val,
        'v0.3',
        TO_TIMESTAMP('March-23-2025 08:42:49', 'Month-DD-YYYY HH24:MI:SS'),
        '0x1c66d49cc66cdc29d45d93b8388acdd62079cf18713de64a84c5260ed40ba0bb',
        '0x48b3475fd2c5d2ae55b80154ea006e6ed6ffb78c8e7dbfd14288168d7da3f7e6',
        'NFT-001',
        '0x20dd388a619f40aaabc36da3314278d0ad763ceb814d838e9853cbe944159af3'
    )
    ON CONFLICT (agent_id) DO UPDATE SET
        version = 'v0.3',
        published_date = TO_TIMESTAMP('March-23-2025 08:42:49', 'Month-DD-YYYY HH24:MI:SS'),
        published_hash = '0x1c66d49cc66cdc29d45d93b8388acdd62079cf18713de64a84c5260ed40ba0bb',
        contract_id = '0x48b3475fd2c5d2ae55b80154ea006e6ed6ffb78c8e7dbfd14288168d7da3f7e6',
        nft_id = 'NFT-001',
        nft_mint_trx_id = '0x20dd388a619f40aaabc36da3314278d0ad763ceb814d838e9853cbe944159af3';

    -- Ensure we have an access level in the table
    INSERT INTO access_level_table (access_level, access_level_name, descriptions_and_permissions)
    VALUES (6, 'Level 6', 'Full access with administrative privileges')
    ON CONFLICT (access_level) DO NOTHING;

    -- Insert NFT access for the owner
    INSERT INTO nft_access (user_id, agent_id, nft_id, access_level, timestamp)
    VALUES (
        '0x22b7e94bb08eb07d59d1a56345e572a5b4409563bc0c0c8fd3eec0ec0bea8d46',
        agent_id_val,
        'NFT-001',
        6,
        NOW()
    )
    ON CONFLICT DO NOTHING;
    
    -- Insert metadata
    INSERT INTO metadata (agent_id, markdown_object)
    VALUES (
        agent_id_val,
        '{"documentation": "# Portfolio Manager\n\nAn AI Blockchain driven portfolio management system that optimizes asset allocation and risk management in Aptos."}'::jsonb
    )
    ON CONFLICT (agent_id) DO UPDATE SET
        markdown_object = '{"documentation": "# Portfolio Manager\n\nAn AI Blockchain driven portfolio management system that optimizes asset allocation and risk management in Aptos."}'::jsonb;
END $$;
```

