const hre = require("hardhat");
const path = require('path');
const fs = require('fs');
const waitForTargetBlock = require('./utils'); // Assuming this is a helper function in your project

async function main() {
  // Replace this with the address of your Chainlink USD/ETH price feed contract
  const oracleAddress = "0x694AA1769357215DE4FAC081bf1f309aDC325306"; // Update with your actual oracle address

  // Deployment
  const Contract = await hre.ethers.deployContract("NFTMarketplace", [oracleAddress]);
  await Contract.deployed();

  console.log(
    `NFTMarketplace contract deployed to: ${Contract.address} on ${hre.network.name}`
  );

  // Save Frontend Files (optional, adjust paths as needed)
  saveFrontendFiles(Contract);

  // Wait for confirmations (optional, adjust number as needed)
  await waitForTargetBlock(5);

  // Verify Contract (optional)
  verifyContract(Contract, oracleAddress); // Assuming verification arguments
}

function saveFrontendFiles(myContract) {
  const contractsDir = path.join(
    __dirname,
    "..",
    "..",
    "/client", // Adjust path to your frontend directory
    "src",
    "abis"
  );

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ ["contractAddress"]: myContract.address }, undefined, 2)
  );

  const ContractArtifact = artifacts.readArtifactSync("NFTMarketplace");

  fs.writeFileSync(
    path.join(contractsDir, "contractAbi.json"),
    JSON.stringify(ContractArtifact, null, 2)
  );
}

async function verifyContract(contract, oracleAddress) {
  console.log("Verifying contract on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: contract.address,
      constructorArguments: [oracleAddress], // Update arguments if needed
    });
    console.log("Contract Verified Successfully");
  } catch (err) {
    console.error(err);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});