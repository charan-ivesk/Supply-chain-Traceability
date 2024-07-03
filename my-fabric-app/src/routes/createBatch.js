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

    // Evaluate the specified transaction with the provided purchase_id.
    const { v4: uuidv4 } = require('uuid');
    const batch_id = uuidv4();

    const employee_id=req.body.employee_id;
    const produce_id=req.body.produce_id;
    const value = req.body.value;

    if ( !value || !employee_id|| !produce_id) {
        return res.status(400).json({ error:  'Employee_id, Produce_id and Value are required in the request body' });
    }

    let str=JSON.stringify(batch_id)
    str=str.slice(1,str.length-1)
    str="BA_"+str
    console.log(batch_id)
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';
    value.created_at=formattedDate;

    let str7 =JSON.stringify(employee_id)
    str7=str7.slice(1,str7.length-1)
    str7="EM_"+str7
    const reply7= await contract.evaluateTransaction('queryByID', str7);
    const result7=JSON.parse(reply7.toString()) 
    if (result7.length==0){
        return res.status(400).json({ error: 'Employee'+str7+'does not exist' });
    }
    else if("status" in result7[0].value && result7[0].value.status=="DEACTIVATED"){
        return res.status(400).json({ error: 'employee '+str7+' has been deactivated' });
    }  

    let str6 =JSON.stringify(produce_id)
    let str61=str6.slice(1,str6.length-1)
    str6="PD_"+str61
    const reply6= await contract.evaluateTransaction('queryByID', str6);
    const result6=JSON.parse(reply6.toString()) 
    if (result6.length==0){
        return res.status(400).json({ error: 'Grain'+str6+'does not exist' });
    }



    let fac=JSON.stringify(result7[0].value.facility_id)
    fac=fac.slice(1,fac.length-1)

    value.facility_id=fac
    await contract.submitTransaction('writeData', str, JSON.stringify(value));
    console.log('Transaction has been submitted');
    
    const result = await contract.evaluateTransaction('queryValidFB', str61,fac);

    // Disconnect from the gateway.
    await gateway.disconnect();
    res.json({ result:JSON.parse(result.toString()),"batch_id": batch_id});
  } 
  catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
    res.status(500).json({ error: 'Failed to evaluate transaction' });
  }
});
module.exports = router;