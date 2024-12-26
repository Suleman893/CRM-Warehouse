const router = require("express").Router();
//controller
const loadingController = require("../../../controllers/inventory/loading/loading.controller");
//helper
const { permissionHandler } = require("../../../middlewares/permissionHandler");

//Get the assigned vehicle/all loading, aggregating from orders the material for each route
router.get(
  "/route-loading/all",
  permissionHandler,
  loadingController.allRouteLoading
);

//Assign the vehicle for loading
router.post(
  "/route-loading/assign-vehicle",
  permissionHandler,
  loadingController.assignVehicle
);

//All loaded vehicles with materials and user assigned
router.get("/loading/all", permissionHandler, loadingController.allLoading);

//load the vehicle, and make transfer document to Complete
router.put(
  "/loading/load-vehicle/:id",
  permissionHandler,
  loadingController.loadVehicle
);

//All unloaded vehicles with left over materials and user assigned
router.get("/unloading/all", permissionHandler, loadingController.allUnLoading);

//unload the vehicle, and make transfer document from vehicle to warehouse (Leftover materials return to the warehouse)
router.put(
  "/unloading/unload-vehicle/:id",
  permissionHandler,
  loadingController.unloadVehicle
);

module.exports = router;
