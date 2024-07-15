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
    const batch_id = req.body.batch_id;

        if (!batch_id ) {
            return res.status(400).json({ error: 'batch_id is required in the request body' });
        }

        let str1 =JSON.stringify(batch_id)
        str1=str1.slice(1,str1.length-1)
        str1="BA_"+str1
  
        const reply1 = await contract.evaluateTransaction('queryByID', str1);

        const result1 =JSON.parse(reply1.toString())
        if (result1.length==0){
            return res.status(400).json({ error: 'Batch does not exist' });
        }
 
        let str6 =JSON.stringify(result1[0].value.produce_id)
        let str61=str6.slice(1,str6.length-1)
        let fac=JSON.stringify(result1[0].value.facility_id)
        fac=fac.slice(1,fac.length-1)
    // Evaluate the specified transaction with the provided purchase_id.

    const result2 = await contract.evaluateTransaction('queryValidFB', str61,fac);

    // Disconnect from the gateway.
    await gateway.disconnect();

    res.json({ result: JSON.parse(result2.toString() )});
  } catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
    res.status(500).json({ error: 'Failed to evaluate transaction' });
  }
});

module.exports = router;