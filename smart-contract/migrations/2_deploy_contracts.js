const fs = require('fs');
const path = require('path');

const MasterAccessControl = artifacts.require("MasterAccessControl");
const NFTAccessControl = artifacts.require("NFTAccessControl");
const NFTMetadata = artifacts.require("NFTMetadata");
const AIServiceAgreementManagement = artifacts.require("AIServiceAgreementManagement");
const NFTContract = artifacts.require("NFTContract");
const Monetization = artifacts.require("Monetization");

module.exports = async function(deployer, network, accounts) {
  const deployerAccount = accounts[0];
  const initialOwner = process.env.INITIAL_OWNER || deployerAccount;
  const subscriptionHandler = accounts[1] || deployerAccount; // Use second account as subscription handler for testing
  const verificationThreshold = process.env.VERIFICATION_THRESHOLD || 2;
  const baseMetadataUri = process.env.BASE_METADATA_URI || "https://api.neuralabs.io/metadata/";

  console.log("\n=== NeuraLabs Contract Deployment ===");
  console.log("Network:", network);
  console.log("Deployer:", deployerAccount);
  console.log("Initial Owner:", initialOwner);
  console.log("Subscription Handler:", subscriptionHandler);
  console.log("Verification Threshold:", verificationThreshold);
  console.log("Base Metadata URI:", baseMetadataUri);
  
  // Track deployment data
  const deploymentData = {
    network: network,
    timestamp: new Date().toISOString(),
    deployer: deployerAccount,
    contracts: {},
    summary: {
      totalContracts: 0,
      success: true,
      totalGasUsed: 0,
      estimatedCostETH: 0
    }
  };
  
  let totalGasUsed = 0;

  try {
    // 1. Deploy MasterAccessControl
    console.log("\n1. Deploying MasterAccessControl...");
    const masterAccessTx = await deployer.deploy(MasterAccessControl, { from: deployerAccount });
    const masterAccessControl = await MasterAccessControl.deployed();
    totalGasUsed += masterAccessTx.receipt.gasUsed;
    
    deploymentData.contracts.MasterAccessControl = {
      address: masterAccessControl.address,
      constructorArgs: [],
      gasUsed: masterAccessTx.receipt.gasUsed
    };
    console.log("✓ MasterAccessControl deployed at:", masterAccessControl.address);

    // 2. Deploy NFTAccessControl
    console.log("\n2. Deploying NFTAccessControl...");
    const nftAccessTx = await deployer.deploy(NFTAccessControl, masterAccessControl.address, { from: deployerAccount });
    const nftAccessControl = await NFTAccessControl.deployed();
    totalGasUsed += nftAccessTx.receipt.gasUsed;
    
    deploymentData.contracts.NFTAccessControl = {
      address: nftAccessControl.address,
      constructorArgs: [masterAccessControl.address],
      gasUsed: nftAccessTx.receipt.gasUsed
    };
    console.log("✓ NFTAccessControl deployed at:", nftAccessControl.address);

    // 3. Deploy NFTMetadata
    console.log("\n3. Deploying NFTMetadata...");
    const nftMetadataTx = await deployer.deploy(NFTMetadata, masterAccessControl.address, nftAccessControl.address, { from: deployerAccount });
    const nftMetadata = await NFTMetadata.deployed();
    totalGasUsed += nftMetadataTx.receipt.gasUsed;
    
    deploymentData.contracts.NFTMetadata = {
      address: nftMetadata.address,
      constructorArgs: [masterAccessControl.address, nftAccessControl.address],
      gasUsed: nftMetadataTx.receipt.gasUsed
    };
    console.log("✓ NFTMetadata deployed at:", nftMetadata.address);

    // 4. Deploy AIServiceAgreementManagement
    console.log("\n4. Deploying AIServiceAgreementManagement...");
    const aiServiceTx = await deployer.deploy(AIServiceAgreementManagement, masterAccessControl.address, nftAccessControl.address, { from: deployerAccount });
    const aiServiceAgreementManagement = await AIServiceAgreementManagement.deployed();
    totalGasUsed += aiServiceTx.receipt.gasUsed;
    
    deploymentData.contracts.AIServiceAgreementManagement = {
      address: aiServiceAgreementManagement.address,
      constructorArgs: [masterAccessControl.address, nftAccessControl.address],
      gasUsed: aiServiceTx.receipt.gasUsed
    };
    console.log("✓ AIServiceAgreementManagement deployed at:", aiServiceAgreementManagement.address);

    // 5. Deploy NFTContract (without monetization initially)
    console.log("\n5. Deploying NFTContract...");
    const nftContractTx = await deployer.deploy(
      NFTContract,
      masterAccessControl.address,
      nftAccessControl.address,
      nftMetadata.address,
      "0x0000000000000000000000000000000000000000", // Monetization will be set later
      { from: deployerAccount }
    );
    const nftContract = await NFTContract.deployed();
    totalGasUsed += nftContractTx.receipt.gasUsed;
    
    deploymentData.contracts.NFTContract = {
      address: nftContract.address,
      constructorArgs: [
        masterAccessControl.address,
        nftAccessControl.address,
        nftMetadata.address,
        "0x0000000000000000000000000000000000000000"
      ],
      gasUsed: nftContractTx.receipt.gasUsed
    };
    console.log("✓ NFTContract deployed at:", nftContract.address);

    // 6. Deploy Monetization
    console.log("\n6. Deploying Monetization...");
    const monetizationTx = await deployer.deploy(
      Monetization,
      masterAccessControl.address,
      nftContract.address,
      nftAccessControl.address,
      nftMetadata.address,
      aiServiceAgreementManagement.address,
      { from: deployerAccount }
    );
    const monetization = await Monetization.deployed();
    totalGasUsed += monetizationTx.receipt.gasUsed;
    
    deploymentData.contracts.Monetization = {
      address: monetization.address,
      constructorArgs: [
        masterAccessControl.address,
        nftContract.address,
        nftAccessControl.address,
        nftMetadata.address,
        aiServiceAgreementManagement.address
      ],
      gasUsed: monetizationTx.receipt.gasUsed
    };
    console.log("✓ Monetization deployed at:", monetization.address);

  // Post-deployment initialization
  console.log("\n=== Post-Deployment Initialization ===");

  // Grant cross-contract access via MasterAccessControl
  console.log("\nGranting cross-contract access...");
  
  // NFTAccessControl permissions
  await masterAccessControl.grantAccess(nftAccessControl.address, nftContract.address);
  await masterAccessControl.grantAccess(nftAccessControl.address, monetization.address);
  await masterAccessControl.grantAccess(nftAccessControl.address, aiServiceAgreementManagement.address);
  console.log("✓ NFTAccessControl permissions granted");

  // NFTMetadata permissions
  await masterAccessControl.grantAccess(nftMetadata.address, nftContract.address);
  await masterAccessControl.grantAccess(nftMetadata.address, monetization.address);
  console.log("✓ NFTMetadata permissions granted");

  // NFTContract permissions
  await masterAccessControl.grantAccess(nftContract.address, monetization.address);
  console.log("✓ NFTContract permissions granted");

  // AIServiceAgreementManagement permissions
  await masterAccessControl.grantAccess(aiServiceAgreementManagement.address, monetization.address);
  await masterAccessControl.grantAccess(aiServiceAgreementManagement.address, nftAccessControl.address);
  console.log("✓ AIServiceAgreementManagement permissions granted");

  // Set AIServiceAgreementManagement reference in NFTAccessControl
  console.log("\nSetting AIServiceAgreementManagement reference...");
  await nftAccessControl.setAIServiceAgreementManagement(aiServiceAgreementManagement.address);
  console.log("✓ AIServiceAgreementManagement reference set");

  // Set Monetization reference in NFTContract
  console.log("\nSetting Monetization reference in NFTContract...");
  await nftContract.setMonetizationContract(monetization.address);
  console.log("✓ Monetization reference set");

  // Set contract references in Monetization
  console.log("\nSetting contract references in Monetization...");
  await monetization.setContractReferences(subscriptionHandler);
  console.log("✓ Contract references set");

  // Set initial commission percentage (e.g., 10%)
  console.log("\nSetting commission percentage to 10%...");
  await monetization.setCommissionPercentage(10);
  console.log("✓ Commission percentage set");

  console.log("\n=== Deployment Complete ===");
  console.log("\nDeployed Addresses:");
  console.log("- MasterAccessControl:", masterAccessControl.address);
  console.log("- NFTAccessControl:", nftAccessControl.address);
  console.log("- NFTMetadata:", nftMetadata.address);
  console.log("- AIServiceAgreementManagement:", aiServiceAgreementManagement.address);
  console.log("- NFTContract:", nftContract.address);
  console.log("- Monetization:", monetization.address);
  console.log("\nSubscription Handler:", subscriptionHandler);
  console.log("\n✓ All contracts deployed and initialized successfully!");

    // Update deployment data
    deploymentData.summary.totalContracts = Object.keys(deploymentData.contracts).length;
    deploymentData.summary.totalGasUsed = totalGasUsed;
    
    // Estimate cost (assuming gas price from env)
    const gasPrice = process.env[`GAS_PRICE_${network.toUpperCase()}`] || 20000000000; // 20 gwei default
    deploymentData.summary.estimatedCostETH = (totalGasUsed * gasPrice / 1e18).toFixed(4);
    
    console.log("\n=== Deployment Summary ===");
    console.log("Total contracts deployed:", deploymentData.summary.totalContracts);
    console.log("Total gas used:", totalGasUsed);
    console.log("Estimated cost (ETH):", deploymentData.summary.estimatedCostETH);
    
    // Save deployment record
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const deploymentFile = path.join(deploymentsDir, `${network}-${timestamp}.json`);
    const latestFile = path.join(deploymentsDir, `${network}-latest.json`);
    
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
    fs.writeFileSync(latestFile, JSON.stringify(deploymentData, null, 2));
    
    console.log("\nDeployment records saved:");
    console.log("- Timestamped:", deploymentFile);
    console.log("- Latest:", latestFile);
    
  } catch (error) {
    console.error("\n✗ Deployment failed:", error.message);
    deploymentData.summary.success = false;
    deploymentData.error = error.message;
    
    // Save error record
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const errorFile = path.join(deploymentsDir, `${network}-error-${timestamp}.json`);
    fs.writeFileSync(errorFile, JSON.stringify(deploymentData, null, 2));
    
    throw error;
  }
};