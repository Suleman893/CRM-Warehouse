const router = require("express").Router();
//controller
const receiptController = require("../../../controllers/finance/receipt/receipt.controller");
const {
  createReceipt,
  changeStatus,
  editReceipt,
} = require("../../../middlewares/payloadValidators/financeValidator");
const { permissionHandler } = require("../../../middlewares/permissionHandler");

//Create an receipt
router.post(
  "/create-receipt",
  permissionHandler,
  createReceipt,
  receiptController.createAnReceipt
);

//Get receipts
router.get("/all", permissionHandler, receiptController.allReceipt);

//Edit Receipt
router.put(
  "/edit/:id",
  permissionHandler,
  editReceipt,
  receiptController.editReceipt
);

//Delete receipts
router.delete(
  "/delete/:id",
  permissionHandler,
  receiptController.deleteReceipt
);

//Change status
router.patch(
  "/status/:id",
  permissionHandler,
  changeStatus,
  receiptController.changeStatus
);

//Receipt detail
router.get("/detail/:id", permissionHandler, receiptController.receiptDetail);

module.exports = router;
