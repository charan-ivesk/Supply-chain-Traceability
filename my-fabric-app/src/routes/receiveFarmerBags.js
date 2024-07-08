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
        const farmbaglist = req.body.farmbaglist;

        const employee_id=req.body.employee_id;

        if (!farmbaglist || !employee_id) {
            return res.status(400).json({ error: 'farmbaglist  and employee_id are required in the request body' });
        }
        
        for (var i=0;i<farmbaglist.length;i++){
            let str =JSON.stringify(farmbaglist[i])
            str=str.slice(1,str.length-1)
            str="FB_"+str
            const reply = await contract.evaluateTransaction('queryByID', str);
            const result=JSON.parse(reply.toString()) 
            if (result.length==0){
                return res.status(400).json({ error: 'FarmerBag '+str+'does not exist' });
            }
            else if(result[0].value.status!="PURCHASED" && result[0].value.status!="INITIATED"){
                return res.status(400).json({ error: 'FarmerBag '+str+' has not been purchased or is already in use' });
            }

        }

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

        for (var i=0;i<farmbaglist.length;i++){
            
            let str =JSON.stringify(farmbaglist[i])
            str=str.slice(1,str.length-1)
            str="FB_"+str
            const reply = await contract.evaluateTransaction('queryByID', str);
            const result=JSON.parse(reply.toString()) 


            const currentDate = new Date();
            const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';
    
            result[0].value.updated_at=formattedDate
            result[0].value.status="RECEIVED"
            purchase_id=result[0].value.purchase_id
            result[0].value.facility_id=result7[0].value.facility_id

            await contract.submitTransaction('writeData', str, JSON.stringify(result[0].value));
            let num= (i+1).toString()
            
            console.log(num +' FarmerBag updated')

            let str3 =JSON.stringify(purchase_id)
            str3=str3.slice(1,str3.length-1)
            str3="PU_"+str3
      
            const reply1 = await contract.evaluateTransaction('queryByID', str3);
    
            const result1 =JSON.parse(reply1.toString())
            let input1=result1[0]
            let con_FBList=input1.value.farmerBag_ids_check
            con_FBList=con_FBList.filter(item=>item !==farmbaglist[i])
            if (con_FBList.length ==0){
                input1.value.status="RECEIVED"
                delete input1.value.farmerBag_ids_check
            }
            else{input1.value.farmerBag_ids_check=con_FBList}


            await contract.submitTransaction('writeData', str3, JSON.stringify(input1.value));

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