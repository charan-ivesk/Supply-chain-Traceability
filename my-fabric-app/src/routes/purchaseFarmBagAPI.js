const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => { 
    try {
        // Load the network configuration
        const ccpPath = path.resolve(__dirname, '..','..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

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

        const farmbag_id = req.body.farmbag_id;
        const supplier_id = req.body.supplier_id;
        const value = req.body.value;

        if (!farmbag_id || !value || !supplier_id) {
            return res.status(400).json({ error: 'farmbag_id, supplier_id and Value are required in the request body' });
        }

        let str1 =JSON.stringify(supplier_id)
        str1=str1.slice(1,str1.length-1)
        str1="SP_"+str1
  
        const reply1 = await contract.evaluateTransaction('queryByID', str1);

        const result1 =JSON.parse(reply1.toString())
        if (result1.length==0){
            return res.status(400).json({ error: 'Supplier does not exist' });
        }
        let input1=result1[0]
        if(input1.value.status=="DEACTIVATED"){
            return res.status(400).json({ error: 'Supplier has been deactivated' });
        }


        let str=JSON.stringify(farmbag_id)
        str=str.slice(1,str.length-1)
        str="FB_"+str
        
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';

        value.created_at=formattedDate
        graintype=value.grain
        if (!value.grain){
        value.grain=input1.value.grain
    }
        value.status="UNUSED"
        const result = await contract.evaluateTransaction('queryByID', str);
        let check=result.toString()
        if (check.length>2){
            return res.status(400).json({ error: 'Farmbag '+str+' already exists' });
        }


        let str2=JSON.stringify(farmbag_id)
        str2=str2.slice(1,str2.length-1)
        str2="QR_"+str2
        const reply2 = await contract.evaluateTransaction('queryByID', str2);
        
        const result2 =JSON.parse(reply2.toString())
        console.log(result2)
        if (result2.length==0){
            return res.status(400).json({ error: 'QR does not exist' });
        }
        let input2=result2[0]
        if(input2.value.status=="USED"){
            return res.status(400).json({ error: 'QR has already been used' });
        }

        await contract.submitTransaction('writeData', str, JSON.stringify(value));
        const value2 = req.body.value;
        value2.updated_at=formattedDate
        value2.status="USED"
        await contract.submitTransaction('writeData', str2, JSON.stringify(value2));
        console.log('Transaction has been submitted');

        // Disconnect from the gateway.
        await gateway.disconnect();

        res.json({ message: 'Transaction submitted successfully' });
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).json({ error: 'Failed to submit transaction' });
    }
});
module.exports = router;