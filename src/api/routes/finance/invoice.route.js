const router = require("express").Router();
//controller
const invoiceController = require("../../../controllers/finance/invoice/invoice.controller");
const {
  createInvoice,
  changeStatus,
} = require("../../../middlewares/payloadValidators/financeValidator");
//helper
const { permissionHandler } = require("../../../middlewares/permissionHandler");

//Create an invoice
router.post(
  "/create-invoice",
  permissionHandler,
  createInvoice,
  invoiceController.createAnInvoice
);

//Get invoice
router.get("/all", permissionHandler, invoiceController.allInvoice);

//Delete invoice
router.delete(
  "/delete/:id",
  permissionHandler,
  invoiceController.deleteInvoice
);

//Change status
router.patch(
  "/status/:id",
  permissionHandler,
  changeStatus,
  invoiceController.changeStatus
);

//Invoice detail
router.get("/detail/:id", permissionHandler, invoiceController.invoiceDetail);

module.exports = router;
