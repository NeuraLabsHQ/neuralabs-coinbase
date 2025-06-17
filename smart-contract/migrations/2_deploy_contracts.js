const MasterAccessControl = artifacts.require("MasterAccessControl");
const NFTAccessControl = artifacts.require("NFTAccessControl");
const NFTMetadata = artifacts.require("NFTMetadata");
const AIServiceAgreementManagement = artifacts.require("AIServiceAgreementManagement");
const NFTContract = artifacts.require("NFTContract");
const Monetization = artifacts.require("Monetization");

module.exports = async function(deployer, network, accounts) {
  const deployerAccount = accounts[0];
  const subscriptionHandler = accounts[1]; // Use second account as subscription handler for testing

  console.log("Deploying contracts with account:", deployerAccount);
  console.log("Subscription handler:", subscriptionHandler);

  // 1. Deploy MasterAccessControl
  console.log("\n1. Deploying MasterAccessControl...");
  await deployer.deploy(MasterAccessControl);
  const masterAccessControl = await MasterAccessControl.deployed();
  console.log("MasterAccessControl deployed at:", masterAccessControl.address);

  // 2. Deploy NFTAccessControl
  console.log("\n2. Deploying NFTAccessControl...");
  await deployer.deploy(NFTAccessControl, masterAccessControl.address);
  const nftAccessControl = await NFTAccessControl.deployed();
  console.log("NFTAccessControl deployed at:", nftAccessControl.address);

  // 3. Deploy NFTMetadata
  console.log("\n3. Deploying NFTMetadata...");
  await deployer.deploy(NFTMetadata, masterAccessControl.address, nftAccessControl.address);
  const nftMetadata = await NFTMetadata.deployed();
  console.log("NFTMetadata deployed at:", nftMetadata.address);

  // 4. Deploy AIServiceAgreementManagement
  console.log("\n4. Deploying AIServiceAgreementManagement...");
  await deployer.deploy(AIServiceAgreementManagement, masterAccessControl.address, nftAccessControl.address);
  const aiServiceAgreementManagement = await AIServiceAgreementManagement.deployed();
  console.log("AIServiceAgreementManagement deployed at:", aiServiceAgreementManagement.address);

  // 5. Deploy NFTContract (without monetization initially)
  console.log("\n5. Deploying NFTContract...");
  await deployer.deploy(
    NFTContract,
    masterAccessControl.address,
    nftAccessControl.address,
    nftMetadata.address,
    "0x0000000000000000000000000000000000000000" // Monetization will be set later
  );
  const nftContract = await NFTContract.deployed();
  console.log("NFTContract deployed at:", nftContract.address);

  // 6. Deploy Monetization
  console.log("\n6. Deploying Monetization...");
  await deployer.deploy(
    Monetization,
    masterAccessControl.address,
    nftContract.address,
    nftAccessControl.address,
    nftMetadata.address,
    aiServiceAgreementManagement.address
  );
  const monetization = await Monetization.deployed();
  console.log("Monetization deployed at:", monetization.address);

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

  // Save deployment info for reference
  const deploymentInfo = {
    network: network,
    deployerAccount: deployerAccount,
    subscriptionHandler: subscriptionHandler,
    contracts: {
      MasterAccessControl: masterAccessControl.address,
      NFTAccessControl: nftAccessControl.address,
      NFTMetadata: nftMetadata.address,
      AIServiceAgreementManagement: aiServiceAgreementManagement.address,
      NFTContract: nftContract.address,
      Monetization: monetization.address
    },
    deploymentTime: new Date().toISOString()
  };

  console.log("\nDeployment info:", JSON.stringify(deploymentInfo, null, 2));
};