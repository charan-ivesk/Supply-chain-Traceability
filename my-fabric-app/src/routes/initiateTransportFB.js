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
        const transport_id = req.body.trs_id;
        const origin_facility_id=req.body.o_facility_id
        const destination_facility_id=req.body.d_facility_id


        if (!transport_id|| !destination_facility_id || !origin_facility_id) {
            return res.status(400).json({ error: 'Transport_id origin and destination are required in the request body' });
        }
        

        let str =JSON.stringify(transport_id)
        str=str.slice(1,str.length-1)
        str="TR_"+str
        const reply = await contract.evaluateTransaction('queryByID', str);
        const result=JSON.parse(reply.toString()) 
        if (result.length==0){
            return res.status(400).json({ error: 'Transport '+str+'does not exist' });
        }
        else if(result[0].value.status!="ATTACHED"){
            return res.status(400).json({ error: 'Transport '+str+' is empty' });
        }

        let str1 =JSON.stringify(origin_facility_id)
        str1=str1.slice(1,str1.length-1)
        str1="FA_"+str1
    
    
        const reply1 = await contract.evaluateTransaction('queryByID', str1);
    
        const result1 =JSON.parse(reply1.toString())
        if (result1.length==0){
            return res.status(400).json({ error: 'Origin facility does not exist' });
        }
    
       
        let str3 =JSON.stringify(destination_facility_id)
        str3=str3.slice(1,str3.length-1)
        str3="FA_"+str3
        
    
        const reply3 = await contract.evaluateTransaction('queryByID', str3);
    
        const result3 =JSON.parse(reply3.toString())
        if (result3.length==0){
            return res.status(400).json({ error: 'Destination facility does not exist' });
        }


        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';

        result[0].value.updated_at=formattedDate
        result[0].value.status="INITIATED"
        result[0].value.source=origin_facility_id
        result[0].value.destination=destination_facility_id
        let facility_id=result[0].value.destination


        await contract.submitTransaction('writeData', str, JSON.stringify(result[0].value));

        
        console.log(' Transport updated')

        let FBlist = result[0].value.farmBag_ids
        for (var j=0;j<FBlist.length;j++){
            let str7 =JSON.str7ingify(FBlist[j])
            str7=str7.slice(1,str7.length-1)
            str7="FB_"+str7
            const reply = await contract.evaluateTransaction('queryByID', str7);
            const result=JSON.parse(reply.toString()) 

            const currentDate = new Date();
            const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';
    
            result[0].value.updated_at=formattedDate
            result[0].value.status="INITIATED"
            result[0].value.nextDestination=facility_id


            await contract.submitTransaction('writeData', str7, JSON.stringify(result[0].value));
            let num= (j+1).toString()
            
            console.log(num +' FarmBag Updated')
        }
        

        // Disconnect from the gateway.
        await gateway.disconnect();
        res.json({ message: 'Transaction submitted successfully' });

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).json({ error: 'Failed to submit transaction' });
    }
});

module.exports = router;
