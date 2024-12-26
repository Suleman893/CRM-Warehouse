const router = require("express").Router();
//controller
const clientController = require("../../controllers/client/client.controller");
//helpers
const {
  changeStatus,
  addComment,
} = require("../../middlewares/payloadValidators/commonValidator");
const {
  addClient,
  editClient,
} = require("../../middlewares/payloadValidators/clientValidator");
const { uploadFiles } = require("../../services/helpers/fileHelper");
const { checkFile } = require("../../middlewares/payloadValidators/fileCheck");
const { permissionHandler } = require("../../middlewares/permissionHandler");

//Add client
router.post(
  "/add",
  permissionHandler,
  uploadFiles,
  addClient,
  // checkFile,
  clientController.addClient
);

//Edit client
router.put(
  "/edit/:id",
  permissionHandler,
  uploadFiles,
  editClient,
  // checkFile,
  clientController.editClient
);

//All client
router.get("/all", permissionHandler, clientController.allClients);

//All client for dropdown
router.get(
  "/dropdown",
  permissionHandler,
  clientController.allClientsForDropdown
);

//Client by id
router.get("/detail/:id", permissionHandler, clientController.clientDetail);

//Comment on client
router.post(
  "/comment/:id",
  permissionHandler,
  uploadFiles,
  addComment,
  checkFile,
  clientController.commentOnClient
);

//Change status
router.patch(
  "/status/:id",
  permissionHandler,
  changeStatus,
  clientController.changeStatus
);

//Decline client
router.patch("/decline/:id", permissionHandler, clientController.declineClient);

//Delete client
router.delete("/delete/:id", permissionHandler, clientController.deleteClient);

//Sync client
router.put("/sync", clientController.syncClient);

module.exports = router;
