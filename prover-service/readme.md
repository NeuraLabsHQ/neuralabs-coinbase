# Prover Service Setup

## Overview

This guide explains how to set up your own prover service for zkLogin functionality. We need to run our own prover service as there was no prover service available for testnet.

URL for the prover service is `<>`

## Prerequisites

1. Install [Git Large File Storage](https://git-lfs.com/) (an open-source Git extension for large file versioning) before downloading the zkey.
   [Linux Version](https://github.com/git-lfs/git-lfs/blob/main/INSTALLING.md)
   ```bash
   curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | sudo bash
   sudo apt-get install git-lfs

   cd prover-service
   ```

## Setup Steps

2. Download the [Groth16 proving key zkey file](https://docs.circom.io/getting-started/proving-circuits/). There are zkeys available for all Sui networks. See [the Ceremony section](#ceremony) for more details on how the main proving key is generated.

   - Main zkey (for Mainnet and Testnet)
     ```sh
     $ wget -O - https://raw.githubusercontent.com/sui-foundation/zklogin-ceremony-contributions/main/download-main-zkey.sh | bash
     ```
   - Test zkey (for Devnet)

     ```sh
     $ wget -O - https://raw.githubusercontent.com/sui-foundation/zklogin-ceremony-contributions/main/download-test-zkey.sh | bash
     ```

   - To verify the download contains the correct zkey file, you can run the following command to check the Blake2b hash: `b2sum ${file_name}.zkey`.

     | Network          | zkey file name      | Hash                                                                                                                               |
     | ---------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
     | Mainnet, Testnet | `zkLogin-main.zkey` | `060beb961802568ac9ac7f14de0fbcd55e373e8f5ec7cc32189e26fb65700aa4e36f5604f868022c765e634d14ea1cd58bd4d79cef8f3cf9693510696bcbcbce` |
     | Devnet           | `zkLogin-test.zkey` | `686e2f5fd969897b1c034d7654799ee2c3952489814e4eaaf3d7e1bb539841047ae8ee5fdcdaca5f4ddd76abb5a8e8eb77b44b693a2ba9d4be57e94292b26ce2` |

3. For the next step, you need two Docker images from the [mysten/zklogin repository](https://hub.docker.com/repository/docker/mysten/zklogin/general) (tagged as `prover` and `prover-fe`). To simplify, a docker compose file is available that automates this process. Run `docker compose` with the downloaded zkey from the same directory as the YAML file.

## Docker Compose Configuration

```yaml
services:
  backend:
    image: mysten/zklogin:prover-stable
    volumes:
      # The ZKEY environment variable must be set to the path of the zkey file.
      - ${ZKEY}:/app/binaries/zkLogin.zkey
    environment:
      - ZKEY=/app/binaries/zkLogin.zkey
      - WITNESS_BINARIES=/app/binaries

  frontend:
    image: mysten/zklogin:prover-fe-stable
    command: '8080'
    ports:
      # The PROVER_PORT environment variable must be set to the desired port.
      - '${PROVER_PORT}:8080'
    environment:
      - PROVER_URI=http://backend:8080/input
      - NODE_ENV=production
      - DEBUG=zkLogin:info,jwks
      # The default timeout is 15 seconds. Uncomment the following line to change it.
      # - PROVER_TIMEOUT=30
```

## Running the Service

```bash
ZKEY=<path_to_zkLogin.zkey> PROVER_PORT=<PROVER_PORT> docker compose up
```

## API Endpoints

To call the service, the following two endpoints are supported:
- `/ping`: To test if the service is up. Running `curl http://localhost:PROVER_PORT/ping` should return `pong`.
- `/v1`: The request and response are the same as the Mysten Labs maintained service.

## Important Notes

- The backend service (mysten/zklogin:prover-stable) is compute-heavy. Use at least the minimum recommended 16 cores and 16GB RAM. Using weaker instances can lead to timeout errors with the message "Call to rapidsnark service took longer than 15s". You can adjust the environment variable `PROVER_TIMEOUT` to set a different timeout value, for example, `PROVER_TIMEOUT=30` for a timeout of 30 seconds.

- If you want to compile the prover from scratch (for performance reasons), please see our fork of [rapidsnark](https://github.com/MystenLabs/rapidsnark#compile-prover-in-server-mode). You'd need to compile and launch the prover in server mode.

- Setting `DEBUG=*` turns on all logs in the prover-fe service some of which may contain PII. Consider using DEBUG=zkLogin:info,jwks in production environments.