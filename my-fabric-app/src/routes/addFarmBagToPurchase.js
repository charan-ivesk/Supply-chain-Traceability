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

        const purchase_id = req.body.purchase_id;
        const farmbaglist = req.body.farmbaglist;

        if (!purchase_id || !farmbaglist) {
            return res.status(400).json({ error: 'purchase_id and farmbaglist are required in the request body' });
        }

        let farmbagdata=[]
        for (var i=0;i<farmbaglist.length;i++){
            let str =JSON.stringify(farmbaglist[i])
            str=str.slice(1,str.length-1)
            str="FB_"+str
            const reply = await contract.evaluateTransaction('queryByID', str);
            const result=JSON.parse(reply.toString())
            console.log(result[0])
            if (result.length==0){
                return res.status(400).json({ error: 'Farmbag '+str+' does not exist' });
            }
            else if("status" in result[0].value && result[0].value.status!="UNUSED"){
                return res.status(400).json({ error: 'Farmbag '+str+' has not been purchased or is already in use' });
            }
            farmbagdata[i]=result[0]
        }

        
        let str =JSON.stringify(purchase_id)
        str=str.slice(1,str.length-1)
        str="PU_"+str
  
        const reply1 = await contract.evaluateTransaction('queryByID', str);

        const result1 =JSON.parse(reply1.toString())




        if (result1.length==0){
            return res.status(400).json({ error: 'Purchase does not exist' });
        }

        let input1=result1[0]
        if (input1.value.hasOwnProperty("farmerBag_ids")) {
            let con_FBList=input1.value.farmerBag_ids.concat(farmbaglist)
            input1.value.farmerBag_ids=con_FBList
        }
        else{
            input1.value.farmerBag_ids=farmbaglist
        }

        if (input1.value.hasOwnProperty("farmerBag_ids_check")) {
            let con_FBList=input1.value.farmerBag_ids_check.concat(farmbaglist)
            input1.value.farmerBag_ids_check=con_FBList
        }
        else{
            input1.value.farmerBag_ids_check=farmbaglist
        }



        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';

        input1.value.updated_at=formattedDate

        await contract.submitTransaction('writeData', str, JSON.stringify(input1.value));
        console.log('Purchase updated')

        for (var i=0;i<farmbagdata.length;i++){
            farmbagdata[i].value.purchase_id=input1.id
            farmbagdata[i].value.supplier_id=input1.value.supplier_id
            let str =JSON.stringify(farmbagdata[i].id)
            str=str.slice(1,str.length-1)
            str="FB_"+str

            const currentDate = new Date();
            const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';
    
            farmbagdata[i].value.updated_at=formattedDate
            farmbagdata[i].value.status="PURCHASED"

            await contract.submitTransaction('writeData', str, JSON.stringify(farmbagdata[i].value));
            console.log('Farmbag updated')
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
