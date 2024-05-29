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
        console.log(req)
        const facility_id = req.body.facility_id;
        const employee_id_list = req.body.employee_id_list;

        if (!facility_id || !employee_id_list) {
            return res.status(400).json({ error: 'facility_id and employee_id_list are required in the request body' });
        }

        let str1 =JSON.stringify(facility_id)
        str1=str1.slice(1,str1.length-1)
        str1="FA_"+str1
  
        const reply1 = await contract.evaluateTransaction('queryByID', str1);

        const result1 =JSON.parse(reply1.toString())
        if (result1.length==0){
            return res.status(400).json({ error: 'facility does not exist' });
        }
        let input1=result1[0]


        let employeedata=[]
        for (var i=0;i<employee_id_list.length;i++){
            let str =JSON.stringify(employee_id_list[i])
            str=str.slice(1,str.length-1)
            str="EM_"+str
            const reply = await contract.evaluateTransaction('queryByID', str);
            const result=JSON.parse(reply.toString())
            if (result.length==0){
                return res.status(400).json({ error: 'employee '+str+' does not exist' });
            }
            else if("status" in result[0].value && result[0].value.status=="DEACTIVATED"){
                return res.status(400).json({ error: 'employee '+str+' has been deactivated' });
            }  
            else if("status" in result[0].value && result[0].value.status=="ASSIGNED"){
                return res.status(400).json({ error: 'employee '+str+' has been already assigned' });
            }     
            console.log(result[0])       
            employeedata[i]=result[0]
        }

        
       


        if (input1.value.hasOwnProperty("employee_ids")) {
            let con_EMList=input1.value.employee_ids.concat(employee_id_list)
            input1.value.employee_ids=con_EMList
        }
        else{
            input1.value.employee_ids=employee_id_list
        }

        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';

        input1.value.updated_at=formattedDate
        

        await contract.submitTransaction('writeData', str1, JSON.stringify(input1.value));
        console.log('facility updated')

        for (var i=0;i<employeedata.length;i++){
            employeedata[i]
            employeedata[i].value.facility_id=input1.id
            let str =JSON.stringify(employeedata[i].id)
            str=str.slice(1,str.length-1)
            str="EM_"+str

            const currentDate = new Date();
            const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';
    
            employeedata[i].value.updated_at=formattedDate
            employeedata[i].value.status="ASSIGNED"

            await contract.submitTransaction('writeData', str, JSON.stringify(employeedata[i].value));
            console.log('Employee updated')
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