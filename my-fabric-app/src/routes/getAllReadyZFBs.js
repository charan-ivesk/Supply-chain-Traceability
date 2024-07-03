const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => { 
  try {
    // load the network configuration
    const ccpPath = path.resolve(__dirname, '..','..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new file system-based wallet for managing identities.
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get('appUser');
    if (!identity) {
      console.log('An identity for the user "appUser" does not exist in the wallet');
      console.log('Run the registerUser.js application before retrying');
      return res.status(400).json({ error: 'User identity not found' });
    }

    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork('mychannel');

    // Get the contract from the network.
    const contract = network.getContract('asctp');
    const facility_id = req.body.facility_id;
    if (!facility_id) {
      return res.status(400).json({ error: 'Missing facility ID parameter' });
    }

    
    let str1=JSON.stringify(facility_id)
    str1=str1.slice(1,str1.length-1)
    let str="FA_"+str1
    
    const result = await contract.evaluateTransaction('queryByID', str);
 
    out=JSON.parse(result.toString())
    out1=out[0]
    if(!out1){
      res.json({ error: 'Purchase doesnt exist' });
    }

    // Evaluate the specified transaction with the provided purchase_id.

    const result1 = await contract.evaluateTransaction('queryAvailableZFB',str1);

    // Disconnect from the gateway.
    await gateway.disconnect();

    res.json({ result: JSON.parse(result1.toString() )});
  } catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
    res.status(500).json({ error: 'Failed to evaluate transaction' });
  }
});

module.exports = router;