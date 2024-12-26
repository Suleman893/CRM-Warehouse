const router = require("express").Router();
//Routes
const taskRouter = require("./routes/task.route");
const clientRouter = require("./routes/client.route");
const storeRouter = require("./routes/store.route");
const orderRouter = require("./routes/order.route");
//Inventory module
const warehouseRouter = require("./routes/inventory/warehouse.route");
const warehouseActionRouter = require("./routes/inventory/warehouseAction.route");
const loadingRouter = require("./routes/inventory/loading.route");
//Finance module
const invoiceRouter = require("./routes/finance/invoice.route");
const receiptRouter = require("./routes/finance/receipt.route");
//Setting module
const serviceRouter = require("./routes/setting/service.route");
const routeRouter = require("./routes/setting/routes.route");
const deviceRouter = require("./routes/setting/device.route");
const materialRouter = require("./routes/setting/material.route");
//User module
const userRouter = require("./routes/user/user.route");

//Basic module routes
router.use("/task", taskRouter);
router.use("/client", clientRouter);
router.use("/store", storeRouter);
router.use("/order", orderRouter);
//Inventory module routes
router.use("/inventory/warehouse", warehouseRouter);
router.use("/inventory/warehouse-action", warehouseActionRouter);
router.use("/inventory", loadingRouter);
//Finance module routes
router.use("/finance/invoice", invoiceRouter);
router.use("/finance/receipt", receiptRouter);
//Setting module routes
router.use("/service", serviceRouter);
router.use("/material", materialRouter);
router.use("/route", routeRouter);
router.use("/device", deviceRouter);
//User module routes
router.use("/users", userRouter);

module.exports = router;
