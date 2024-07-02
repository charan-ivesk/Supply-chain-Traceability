const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        // Load the network configuration
        const ccpPath = path.resolve(__dirname, '..','..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        console.log(`${ccpPath}`);
        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system-based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        console.log(`Wallet path: ${walletPath}`);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

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
        const { v4: uuidv4 } = require('uuid');
        const purchase_id = uuidv4();
        const supplier_id = req.body.supplier_id;
        console.log(supplier_id)
        const produce_id = req.body.produce_id;
        const value = req.body.value;

        if (!value || !supplier_id || !produce_id) {
            return res.status(400).json({ error: 'supplier_id, produce_id and Value are required in the request body' });
        }

        let str=JSON.stringify(purchase_id)
        str=str.slice(1,str.length-1)
        str="PU_"+str

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

        let str4 =JSON.stringify(produce_id)
        str4=str4.slice(1,str4.length-1)
        str4="PD_"+str4
  
        const reply4 = await contract.evaluateTransaction('queryByID', str4);


        const result4 =JSON.parse(reply4.toString())
        console.log(reply4)
        if (result4.length==0){
            return res.status(400).json({ error: 'produce does not exist' });
        }

        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';
        value.created_at=formattedDate

        if (input1.value.hasOwnProperty("purchase_ids")) {
            let temp=input1.value.purchase_ids.concat([purchase_id])
            input1.value.purchase_ids=temp
        }
        else{
            input1.value.purchase_ids=[purchase_id]
        }

        input1.value.updated_at=formattedDate

        

        await contract.submitTransaction('writeData', str1, JSON.stringify(input1.value));

        value.supplier_id=supplier_id
        value.produce_id=produce_id
        value.status="CREATED"
        await contract.submitTransaction('writeData', str, JSON.stringify(value));
        console.log('Transaction has been submitted');

        // Disconnect from the gateway.
        await gateway.disconnect();

        res.json({ "Status": 'Transaction submitted successfully',
        "purchase_id": purchase_id
         });
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).json({ error: 'Failed to submit transaction' });
    }
});

module.exports = router;
