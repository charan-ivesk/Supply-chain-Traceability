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

        const zeroflybag_id = req.body.zeroflybag_id;
        const employee_id=req.body.employee_id;
        const value = req.body.value;

        if (!zeroflybag_id || !value || !employee_id) {
            return res.status(400).json({ error: 'zeroflybag_id employee_id and Value are required in the request body' });
        }

        let str=JSON.stringify(zeroflybag_id)
        str=str.slice(1,str.length-1)
        str="ZF_"+str
        
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';

        value.created_at=formattedDate
        value.status="UNUSED"
        value.history=[]

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

        let fac=JSON.stringify(result7[0].value.facility_id)
        fac=fac.slice(1,fac.length-1)

        value.facility_id=fac

        const result = await contract.evaluateTransaction('queryByID', str);
        let check=result.toString()
        if (check.length>2){
            return res.status(400).json({ error: 'ZeroFlyBag '+str+' already exists' });
        }

        await contract.submitTransaction('writeData', str, JSON.stringify(value));
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