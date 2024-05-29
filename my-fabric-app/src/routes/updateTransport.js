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
    const transport_id = req.body.transport_id;
    const driver_id=req.body.new_driver_id
    const destination= req.body.new_destination;

    if (!transport_id) {
        return res.status(400).json({ error: 'transport_id is required in the request body' });
    }

    if(!driver_id){
      if(!destination){
      return res.status(400).json({ error: 'Either new driver or destination is required in the request body' });}
      else{
        let str=JSON.stringify(transport_id)
        str=str.slice(1,str.length-1)
        str="TR_"+str
        
        const reply100 = await contract.evaluateTransaction('queryByID', str);
        const result1=JSON.parse(reply100.toString()) 
        if (result1.length==0){
            return res.status(400).json({ error: 'Transport '+str+'does not exist' });
        }
        else if(result1[0].value.status=="INITIATED" ){
            return res.status(400).json({ error: 'Transport '+str+' has already started' });
        }
    
    
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';
        result1[0].value.updated_at=formattedDate;
        result1[0].value.destination=destination;
    
        await contract.submitTransaction('writeData', str, JSON.stringify(result1[0].value));
        console.log('Transport has been updated');
  
    
        // Disconnect from the gateway.
        await gateway.disconnect();
        res.json({"Updated":"Transport"});
      }
    }

    if(!destination){
      if(!driver_id){
      return res.status(400).json({ error: 'Either new driver or destination is required in the request body' });}
      else{
        let str=JSON.stringify(transport_id)
        str=str.slice(1,str.length-1)
        str="TR_"+str
        
        const reply100 = await contract.evaluateTransaction('queryByID', str);
        const result1=JSON.parse(reply100.toString()) 
        if (result1.length==0){
            return res.status(400).json({ error: 'Transport '+str+'does not exist' });
        }
        else if(result1[0].value.status=="INITIATED" ){
            return res.status(400).json({ error: 'Transport '+str+' has already started' });
        }
    
        let str10=JSON.stringify(driver_id)
        str10=str10.slice(1,str10.length-1)
        str10="DR_"+str10
        
        const reply10 = await contract.evaluateTransaction('queryByID', str10);
        const result10=JSON.parse(reply10.toString())
        console.log(result10[0])
        if (result10.length==0){
            return res.status(400).json({ error: 'Driver '+str10+' does not exist' });
        }
        else if("status" in result10[0].value && result10[0].value.status!="AVAILABLE"){
            return res.status(400).json({ error: 'Driver '+str10+' is not available or is already travelling' });
        }            
    
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';

        let str2=JSON.stringify(result1[0].value.driver_id)
        str2=str2.slice(1,str2.length-1)
        str2="DR_"+str2

        const reply2 = await contract.evaluateTransaction('queryByID', str2);
        const result2=JSON.parse(reply2.toString())

        result2[0].value.updated_at=formattedDate
        result2[0].value.status="AVAILABLE"

        await contract.submitTransaction('writeData', str2, JSON.stringify(result2[0].value));
        console.log('Old Driver has been updated');

        result1[0].value.updated_at=formattedDate;
        result1[0].value.driver_id=driver_id;
    
        result10[0].value.updated_at=formattedDate
        result10[0].value.status="ATTACHED"
        
    
        await contract.submitTransaction('writeData', str, JSON.stringify(result1[0].value));
        console.log('Transport has been updated');
    
        await contract.submitTransaction('writeData', str10, JSON.stringify(result10[0].value));
        console.log('new Driver has been updated');
    
        const result = await contract.evaluateTransaction('queryAvailableZFB');
    
        // Disconnect from the gateway.
        await gateway.disconnect();
        res.json({ result:JSON.parse(result.toString())});
      }
    }

    if(destination && driver_id){
        let str=JSON.stringify(transport_id)
        str=str.slice(1,str.length-1)
        str="TR_"+str
        
        const reply100 = await contract.evaluateTransaction('queryByID', str);
        const result1=JSON.parse(reply100.toString()) 

        console.log(result1[0].value.status)

        if (result1.length==0){
            return res.status(400).json({ error: 'Transport '+str+'does not exist' });
        }

        else if(result1[0].value.status=="INITIATED" ){
            return res.status(400).json({ error: 'Transport '+str+' has already started' });
        }
    
        let str10=JSON.stringify(driver_id)
        str10=str10.slice(1,str10.length-1)
        str10="DR_"+str10
        
        const reply10 = await contract.evaluateTransaction('queryByID', str10);
        const result10=JSON.parse(reply10.toString())
        console.log(result10[0])
        if (result10.length==0){
            return res.status(400).json({ error: 'Driver '+str10+' does not exist' });
        }
        else if("status" in result10[0].value && result10[0].value.status!="AVAILABLE"){
            return res.status(400).json({ error: 'Driver '+str10+' is not available or is already travelling' });
        }            
    
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';

        let str2=JSON.stringify(result1[0].value.driver_id)
        str2=str2.slice(1,str2.length-1)
        str2="DR_"+str2

        const reply2 = await contract.evaluateTransaction('queryByID', str2);
        const result2=JSON.parse(reply2.toString())

        result2[0].value.updated_at=formattedDate
        result2[0].value.status="AVAILABLE"

        await contract.submitTransaction('writeData', str2, JSON.stringify(result2[0].value));
        console.log('Old Driver has been updated');

        result1[0].value.updated_at=formattedDate;
        result1[0].value.driver_id=driver_id;
    
        result10[0].value.updated_at=formattedDate
        result10[0].value.status="ATTACHED"
        
    
        await contract.submitTransaction('writeData', str, JSON.stringify(result1[0].value));
        console.log('Transport has been updated');
    
        await contract.submitTransaction('writeData', str10, JSON.stringify(result10[0].value));
        console.log('new Driver has been updated');
    
        const result = await contract.evaluateTransaction('queryAvailableZFB');
    
        // Disconnect from the gateway.
        await gateway.disconnect();
        res.json({ result:JSON.parse(result.toString())});
      }

   
  } 
  catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
    res.status(500).json({ error: 'Failed to evaluate transaction' });
  }
});
module.exports = router;