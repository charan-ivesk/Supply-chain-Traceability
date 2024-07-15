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
    const zfbid = req.body.zfb_id;
      const statusOfZFB= req.body.status
      const notes = req.body.notes

      if (!zfbid || !statusOfZFB) {
          return res.status(400).json({ error: 'Zeroflybag and Status are required in the request body' });
      }
      
      let str =JSON.stringify(zfbid)
      str=str.slice(1,str.length-1)
      str="ZF_"+str
      const reply = await contract.evaluateTransaction('queryByID', str);
      const result=JSON.parse(reply.toString()) 
      if (result.length==0){
          return res.status(400).json({ error: 'ZeroFlyBag '+str+'does not exist' });
      }
      // else if(result[0].value.status!="REACHED"){
      //     return res.status(400).json({ error: 'ZeroFlyBag '+str+' was not ready to be sold' });
      // }


      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';

      result[0].value.updated_at=formattedDate
      result[0].value.status=statusOfZFB
      


      if(statusOfZFB=="DEFECT"){
        const output={}
        let str1=result[0].value.batch_id
        str1=str1.slice(0,str1.length-1)
        str1="BA_"+str1

        const reply1 = await contract.evaluateTransaction('queryByID', str1);
        const result1=JSON.parse(reply1.toString())

        if(notes){
          result[0].value.notes=notes
        }

        output.ZFB_id=result[0].id
        console.log(output)
        output.status=result[0].value.status
        output.batch_id=result[0].value.batch_id

        let array=result1[0].value.farmerBag_ids
        output.farmbagList=array
        
        await contract.submitTransaction('writeData', str, JSON.stringify(result[0].value));
        await gateway.disconnect();
        res.json(output);
        
      }

      await contract.submitTransaction('writeData', str, JSON.stringify(result[0].value));
      await gateway.disconnect();
      res.json({ message: 'Sale Reported' });


    // Disconnect from the gateway.

  } 
  catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
    res.status(500).json({ error: 'Failed to evaluate transaction' });
  }
});
module.exports = router;