const express = require('express');

const app = express();
const port = 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const addFarmBagToBatchRouter = require('./src/routes/addFarmBagToBatch');
const addFarmBagToPurchaseRouter = require('./src/routes/addFarmBagToPurchase');
const addZFBToBatchRouter = require('./src/routes/addZFBToBatch');
const addZFBToTransportRouter = require('./src/routes/addZFBToTransport');
const allBatchRouter = require('./src/routes/allBatch');
const allFarmerBagsRouter = require('./src/routes/allFarmerBags');
const allPurchaseAPIRouter = require('./src/routes/allPurchaseAPI');
const allZFBRouter = require('./src/routes/allZFB');
const availableDriversRouter = require('./src/routes/availableDrivers');
const createBatchRouter = require('./src/routes/createBatch');
const createDriverRouter = require('./src/routes/createDriver');
const createPurchaseAPIRouter = require('./src/routes/createPurchaseAPI');
const createTransportRouter = require('./src/routes/createTransport');
const getAllReadyZFBsRouter = require('./src/routes/getAllReadyZFBs');
const getBatchRouter = require('./src/routes/getBatch');
const getBagsinPurchaseRouter = require('./src/routes/getBagsinPurchase');
const initiateTransportRouter = require('./src/routes/initiateTransport');
const purchaseFarmBagAPIRouter = require('./src/routes/purchaseFarmBagAPI');
const purchaseZeroFlyBagAPIRouter = require('./src/routes/purchaseZeroFlyBagAPI');
const reachedZeroFlyBagsRouter = require('./src/routes/reachedZeroFlyBags');
const readyZFBRouter = require('./src/routes/readyZFB');
const receiveFarmerBagsRouter = require('./src/routes/receiveFarmerBags');
const receiveTransportRouter = require('./src/routes/receiveTransport');
const receiveZeroFlyBagsRouter = require('./src/routes/receiveZeroFlyBags');
const removeFarmBagFromBatchRouter = require('./src/routes/removeFarmBagFromBatch');
const saleOrDefectRouter = require('./src/routes/saleOrDefect');
const updateZFBLocationRouter = require('./src/routes/updateZFBLocation');
const validZFBRouter = require('./src/routes/validZFB');
const receivePurchaseRouter = require('./src/routes/receivePurchase');
const pendingPurchaseRouter = require('./src/routes/pendingPurchase');
const createSupplierRouter = require('./src/routes/createSupplier');
const updateTransportRouter = require('./src/routes/updateTransport');
const allSuppliersRouter = require('./src/routes/allSuppliers');
const allEmployeesRouter = require('./src/routes/allEmployees');
const createEmployeeRouter = require('./src/routes/createEmployee');
const editEmployeeRouter = require('./src/routes/editEmployee');
const deactivateEmployeeRouter = require('./src/routes/deactivateEmployee');
const deactivateSupplierRouter = require('./src/routes/deactivateSupplier');
const createFacilityRouter = require('./src/routes/createFacility');
const editFacilityRouter = require('./src/routes/editFacility');
const editSupplierRouter = require('./src/routes/editSupplier');
const generateQRRouter = require('./src/routes/generateQR');
const assignEmployeeRouter = require('./src/routes/assignEmployee');
const allQRRouter = require('./src/routes/allQR');
const getFBRouter = require('./src/routes/getFB');
const createProduceRouter = require('./src/routes/createProduce');
const getProduceRouter = require('./src/routes/getProduce');
const getFacilityRouter = require('./src/routes/getFacility');
const getEmployeeRouter = require('./src/routes/getEmployee');



app.use('/api/addFarmBagToBatch', addFarmBagToBatchRouter);
app.use('/api/addFarmBagToPurchase', addFarmBagToPurchaseRouter);
app.use('/api/addZFBToBatch', addZFBToBatchRouter);
app.use('/api/addZFBToTransport', addZFBToTransportRouter);
app.use('/api/allBatch', allBatchRouter);
app.use('/api/allFarmerBags', allFarmerBagsRouter);
app.use('/api/allPurchaseAPI', allPurchaseAPIRouter);
app.use('/api/allZFB', allZFBRouter);
app.use('/api/availableDrivers', availableDriversRouter);
app.use('/api/createBatch', createBatchRouter);
app.use('/api/createDriver', createDriverRouter);
app.use('/api/createPurchaseAPI', createPurchaseAPIRouter);
app.use('/api/createTransport', createTransportRouter);
app.use('/api/getAllReadyZFBs', getAllReadyZFBsRouter);
app.use('/api/getBagsinPurchase', getBagsinPurchaseRouter);
app.use('/api/initiateTransport', initiateTransportRouter);
app.use('/api/purchaseFarmBagAPI', purchaseFarmBagAPIRouter);
app.use('/api/purchaseZeroFlyBagAPI', purchaseZeroFlyBagAPIRouter);
app.use('/api/reachedZeroFlyBags', reachedZeroFlyBagsRouter);
app.use('/api/readyZFB', readyZFBRouter);
app.use('/api/receiveFarmerBags', receiveFarmerBagsRouter);
app.use('/api/receiveTransport', receiveTransportRouter);
app.use('/api/receiveZeroFlyBags', receiveZeroFlyBagsRouter);
app.use('/api/removeFarmBagFromBatch', removeFarmBagFromBatchRouter);
app.use('/api/saleOrDefect', saleOrDefectRouter);
app.use('/api/updateZFBLocation', updateZFBLocationRouter);
app.use('/api/validZFB', validZFBRouter);
app.use('/api/getBatch', getBatchRouter);
app.use('/api/receivePurchase', receivePurchaseRouter);
app.use('/api/pendingPurchase', pendingPurchaseRouter);
app.use('/api/createSupplier', createSupplierRouter);
app.use('/api/updateTransport', updateTransportRouter);
app.use('/api/allEmployees', allEmployeesRouter);
app.use('/api/allSuppliers', allSuppliersRouter);
app.use('/api/deactivateSupplier', deactivateSupplierRouter);
app.use('/api/deactivateEmployee', deactivateEmployeeRouter);
app.use('/api/editEmployee', editEmployeeRouter);
app.use('/api/createEmployee', createEmployeeRouter);
app.use('/api/editFacility', editFacilityRouter);
app.use('/api/createFacility', createFacilityRouter);
app.use('/api/editSupplier', editSupplierRouter);
app.use('/api/generateQR', generateQRRouter);
app.use('/api/assignEmployee', assignEmployeeRouter);
app.use('/api/allQR', allQRRouter);
app.use('/api/getFB', getFBRouter);
app.use('/api/createProduce', createProduceRouter);
app.use('/api/getProduce', getProduceRouter);
app.use('/api/getFacility', getFacilityRouter);
app.use('/api/getEmployee', getEmployeeRouter);




app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
