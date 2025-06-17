# NeuraLabs Database Setup

This directory contains scripts for managing the NeuraLabs database setup, initialization, and data population.

## Overview

The database system manages flowbuilder blocks that are used in the NeuraLabs AI workflow platform. These blocks are organized in YAML files by category and automatically populated into PostgreSQL.

## Directory Structure

```
database/
├── README.md              # This file
├── .env.example          # Environment variables template
├── initiate.py           # Database initialization script
├── populate.py           # Block population script
├── yaml_extractor.py     # Legacy YAML extraction utility
└── blocks/               # YAML block definitions
    ├── AI/               # AI-related blocks
    ├── Blockchain/       # Blockchain interaction blocks
    ├── Custom/           # Custom code execution blocks
    ├── Flow Control/     # Flow control blocks (Start, End, etc.)
    ├── Input/            # Input handling blocks
    └── Utility/          # Utility and data manipulation blocks
```

## Prerequisites

1. **PostgreSQL Database**: Running PostgreSQL instance
2. **Python Dependencies**: Install required packages
   ```bash
   pip install psycopg2-binary python-dotenv pyyaml
   ```

## Environment Setup

1. **Create Environment File**: Copy the example and configure your database connection
   ```bash
   cp .env.example .env
   ```

2. **Configure Database Connection**: Edit `.env` with your database details
   ```bash
   # Database Configuration
   POSTGRES_HOST=localhost
   POSTGRES_DB=neuralabs
   POSTGRES_USER=your_username
   POSTGRES_PASSWORD=your_password
   POSTGRES_PORT=5432
   ```

## Database Initialization

The `initiate.py` script creates all necessary database tables and schema.

### Usage
```bash
# Initialize database (create tables)
python initiate.py
```

### What it does:
- Creates the `flowbuilder_blocks` table with all required columns
- Sets up proper indexes and constraints
- Handles table creation safely (won't recreate existing tables)

## Block Population

The `populate.py` script manages loading block definitions from YAML files into the database.

### Usage Options

#### 1. Check Database Status (Read-Only)
```bash
# Check what tables exist and data counts
python populate.py --check
```

#### 2. Interactive Population (Default)
```bash
# Interactive mode - asks for confirmation on each change
python populate.py
```

#### 3. Automatic Population
```bash
# Auto-confirm all changes without prompting
python populate.py --auto
```

### Population Features

1. **Smart Comparison**: Compares existing database blocks with YAML files
2. **Change Detection**: Shows detailed differences when blocks have changed
3. **User Confirmation**: Asks before creating/updating blocks (unless `--auto` flag is used)
4. **Comprehensive Reporting**: Shows summary tables of all changes

### Population Process

1. **Load YAML Files**: Traverses `blocks/` directory and loads all `.yaml` files
2. **Compare with Database**: Checks existing blocks against new definitions
3. **Handle Changes**:
   - **New Blocks**: Prompts to create new blocks
   - **Modified Blocks**: Shows differences and prompts to update
   - **Unchanged Blocks**: Skips without changes
4. **Generate Reports**: Shows summary of Created, Modified, and Unchanged blocks

### Example Output

```
📊 SUMMARY
============================================================

✅ Created (3 blocks):
  - Custom:CustomBlock
  - Utility:NewUtility
  - AI:TestBlock

🔄 Modified (2 blocks):
  - AI:LLMStructured
  - Blockchain:BuildTransaction

⏸️  Unchanged (14 blocks):
  - Input:ChatInput
  - Input:Constants
  - ...
```

## Block Structure

Each YAML file in the `blocks/` directory represents a single block type. The file structure should follow this format:

```yaml
type: "BlockTypeName"
element_id: null
name: null
node_description: "Description of what this block does"
description: null
input_schema:
  field_name:
    type: "string"
    description: "Field description"
    required: true
output_schema: {}
parameter_schema_structure:
  param_name:
    type: "string"
    description: "Parameter description"
parameters:
  param_name: "default_value"
processing_message: "Processing status message"
tags:
  - "category-tag"
  - "feature-tag"
layer: null
hyperparameters: {}
input_data: null
output_data: null
code: null
flow_control: null
icon: "FiIcon"
category: "Category Name"
```

### Categories

Blocks are organized into the following categories:

- **AI**: Language models and AI-powered blocks
- **Blockchain**: SUI blockchain interaction blocks
- **Custom**: User-defined code execution blocks
- **Flow Control**: Workflow control blocks (Start, End, Case, etc.)
- **Input**: Data input and configuration blocks
- **Utility**: Data manipulation and utility blocks

## Database Schema

### flowbuilder_blocks Table

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing ID |
| type | VARCHAR(100) UNIQUE | Block type identifier |
| element_id | VARCHAR(100) | Element ID (optional) |
| name | VARCHAR(255) | Display name |
| node_description | TEXT | Block description |
| description | TEXT | Additional description |
| input_schema | JSONB | Input field definitions |
| output_schema | JSONB | Output field definitions |
| parameter_schema_structure | JSONB | Parameter schema |
| parameters | JSONB | Default parameter values |
| processing_message | TEXT | Status message during execution |
| tags | JSONB | Block tags |
| layer | VARCHAR(100) | Layer classification |
| hyperparameters | JSONB | Hyperparameter configuration |
| input_data | JSONB | Input data (optional) |
| output_data | JSONB | Output data (optional) |
| code | TEXT | Custom code (for Custom blocks) |
| flow_control | JSONB | Flow control configuration |
| icon | VARCHAR(50) | Icon identifier |
| category | VARCHAR(100) | Block category |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## Troubleshooting

### Common Issues

1. **Connection Error**: Verify your `.env` file has correct database credentials
2. **Table Not Found**: Run `python initiate.py` first to create tables
3. **Permission Error**: Ensure your database user has CREATE and INSERT permissions
4. **YAML Parse Error**: Check YAML file syntax in the `blocks/` directory

### Debug Commands

```bash
# Check database connection and tables
python populate.py --check

# View detailed error logs
python populate.py --auto 2>&1 | tee population.log
```

## Development Workflow

1. **Add New Blocks**: Create YAML files in appropriate `blocks/` subdirectories
2. **Test Changes**: Use `python populate.py --check` to verify configuration
3. **Update Database**: Run `python populate.py` to apply changes
4. **Verify Results**: Check the summary tables to confirm all changes applied correctly

## Integration

This database setup integrates with:

- **Frontend**: React application queries blocks for flowbuilder UI
- **Backend API**: FastAPI serves block definitions to frontend
- **HPC Execution**: Workflow execution engine uses block configurations

For more information about the overall NeuraLabs architecture, see the main project documentation.