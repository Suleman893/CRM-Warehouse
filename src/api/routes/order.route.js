const router = require("express").Router();
//controller
const orderController = require("../../controllers/order/order.controller");
//helpers
const {
  changePriority,
  addComment,
} = require("../../middlewares/payloadValidators/commonValidator");
const { checkFile } = require("../../middlewares/payloadValidators/fileCheck");
const {
  addOrder,
  changeOrderStatus,
  editOrder,
} = require("../../middlewares/payloadValidators/orderValidator");
const { permissionHandler } = require("../../middlewares/permissionHandler");
const { uploadFiles } = require("../../services/helpers/fileHelper");

//Add order
router.post("/add", permissionHandler, addOrder, orderController.addOrder);

//Edit order
router.put(
  "/edit/:id",
  permissionHandler,
  editOrder,
  orderController.editOrder
);

//All order
router.get("/all", permissionHandler, orderController.allOrders);

//order by id
router.get("/detail/:id", permissionHandler, orderController.orderById);

//Comment on order
router.post(
  "/comment/:id",
  permissionHandler,
  uploadFiles,
  addComment,
  checkFile,
  orderController.commentOnOrder
);

//Change status
router.patch(
  "/status/:id",
  permissionHandler,
  changeOrderStatus,
  orderController.changeStatus
);

//Change priority
router.patch(
  "/priority/:id",
  permissionHandler,
  changePriority,
  orderController.changePriority
);

//Delete order
router.delete("/delete/:id", permissionHandler, orderController.deleteOrder);

module.exports = router;
