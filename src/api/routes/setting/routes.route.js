const router = require("express").Router();
//controller
const routeController = require("../../../controllers/setting/route/route.controller");
//helpers
const {
  changeStatus,
} = require("../../../middlewares/payloadValidators/commonValidator");
const {
  addRoute,
} = require("../../../middlewares/payloadValidators/routeValidator");
const { permissionHandler } = require("../../../middlewares/permissionHandler");

//Add route
router.post("/add", permissionHandler, addRoute, routeController.addRoute);

//All routes
router.get("/all", permissionHandler, routeController.allRoutes);

//All route for dropdown
router.get(
  "/dropdown",
  permissionHandler,
  routeController.allRoutesForDropdown
);

//Edit route
router.put("/edit/:id", permissionHandler, addRoute, routeController.editRoute);

//Delete route
router.delete("/delete/:id", permissionHandler, routeController.deleteRoute);

//Change status
router.patch(
  "/status/:id",
  permissionHandler,
  changeStatus,
  routeController.changeStatus
);

//Sync route
router.put("/sync", routeController.syncRoute);

module.exports = router;
