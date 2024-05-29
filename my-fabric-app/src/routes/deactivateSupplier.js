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
    const identity = await wallet.get('admin');
    if (!identity) {
      console.log('An identity for the user "admin" does not exist in the wallet');
      console.log('Run the registerUser.js application before retrying');
      return res.status(400).json({ error: 'User identity not found' });
    }

    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'admin', discovery: { enabled: true, asLocalhost: true } });

    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork('mychannel');

    // Get the contract from the network.
    const contract = network.getContract('asctp');

    // Evaluate the specified transaction with the provided purchase_id.
    const supplier_id = req.body.supplier_id;


    if (!supplier_id) {
        return res.status(400).json({ error: 'supplier_id is required in the request body' });
    }

    let str=JSON.stringify(supplier_id)
    str=str.slice(1,str.length-1)
    str="SP_"+str
    
    const reply100 = await contract.evaluateTransaction('queryByID', str);
    const result1=JSON.parse(reply100.toString()) 

    if (result1.length==0){
        return res.status(400).json({ error: 'Supplier '+str+'does not exist' });
    }

    else if(result1[0].value.status=="DEACTIVATED" ){
        return res.status(400).json({ error: 'Supplier '+str+' has already been deactivated' });
    }          

    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';

    result1[0].value.status="DEACTIVATED";
    result1[0].value.updated_at=formattedDate;
    
    

    await contract.submitTransaction('writeData', str, JSON.stringify(result1[0].value));
    console.log('Supplier has been edited');


  

    // Disconnect from the gateway.
    await gateway.disconnect();
    res.json({ str:"updated"});
      

   
  } 
  catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
    res.status(500).json({ error: 'Failed to evaluate transaction' });
  }
});
module.exports = router;