#!/bin/bash

# Define purple color
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Step 1: Go back one folder and then to test-network
echo -e "${PURPLE}Navigating to test-network directory...${NC}"
cd ../test-network

# Step 2: Run the network.sh script to set up the network
echo -e "${PURPLE}Setting up the network...${NC}"
./network.sh up createChannel -c mychannel -ca -s couchdb

# Step 3: Deploy the chaincode
echo -e "${PURPLE}Deploying chaincode...${NC}"
./network.sh deployCC -ccn asctp -ccp ../agro-supply-chain/chaincode-javascript/ -ccl javascript

# Step 4: Navigate back to my-fabric-app
echo -e "${PURPLE}Navigating back to my-fabric-app directory...${NC}"
cd ../my-fabric-app

# Step 4: Run enrollAdmin.js
echo -e "${PURPLE}Running enrollAdmin.js...${NC}"
node enrollAdmin.js

# Step 5: Run registerUser.js
echo -e "${PURPLE}Running registerUser.js...${NC}"
node registerUser.js

# Step 6: Run main.js
echo -e "${PURPLE}Running main.js...${NC}"
node main.js

echo -e "${PURPLE}All steps completed successfully.${NC}"
