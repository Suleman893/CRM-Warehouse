const router = require("express").Router();
//controller
const storeController = require("../../controllers/store/store.controller");
//helpers
const {
  changeStatus,
  addComment,
} = require("../../middlewares/payloadValidators/commonValidator");
const {
  addStore,
  editStore,
} = require("../../middlewares/payloadValidators/clientValidator");
const { checkFile } = require("../../middlewares/payloadValidators/fileCheck");
const { uploadFiles } = require("../../services/helpers/fileHelper");
const { permissionHandler } = require("../../middlewares/permissionHandler");

//Add store in client (:id is client id)
router.post(
  "/add/:id",
  permissionHandler,
  uploadFiles,
  addStore,
  // checkFile,
  storeController.addStore
);

//Edit store
router.put(
  "/edit/:id",
  permissionHandler,
  uploadFiles,
  editStore,
  // checkFile,
  storeController.editStore
);

//All stores
// router.get("/all", storeController.getAllStores);

//Store by id
router.get("/detail/:id", permissionHandler, storeController.storeDetail);

//Comment on store
router.post(
  "/comment/:id",
  permissionHandler,
  uploadFiles,
  addComment,
  storeController.commentOnStore
);

//Change status
router.patch(
  "/status/:id",
  permissionHandler,
  changeStatus,
  storeController.changeStatus
);

//Decline store
router.patch("/decline/:id", permissionHandler, storeController.declineStore);

//Delete store
router.delete("/delete/:id", permissionHandler, storeController.deleteStore);

module.exports = router;
