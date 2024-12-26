const router = require("express").Router();
//controller
const materialController = require("../../../controllers/setting/material/material.controller");
//helpers
const {
  changeStatus,
} = require("../../../middlewares/payloadValidators/commonValidator");
const { uploadFiles } = require("../../../services/helpers/fileHelper");
const {
  checkFile,
  checkFiles,
} = require("../../../middlewares/payloadValidators/fileCheck");
const {
  addMaterial,
} = require("../../../middlewares/payloadValidators/materialValidator");
const { permissionHandler } = require("../../../middlewares/permissionHandler");

//Add material
router.post(
  "/add",
  permissionHandler,
  uploadFiles,
  addMaterial,
  // checkFile,
  // checkFiles,
  materialController.addMaterial
);

//All materials
router.get("/all", permissionHandler, materialController.allMaterials);

//All materials for dropdown, can be used in import warehouse action
router.get(
  "/dropdown",
  permissionHandler,
  materialController.allMaterialsForDropdown
);

//Edit material
router.put(
  "/edit/:id",
  permissionHandler,
  uploadFiles,
  materialController.editMaterial
);

//Delete material
router.delete(
  "/delete/:id",
  permissionHandler,
  materialController.deleteMaterial
);

//Change status
router.patch(
  "/status/:id",
  permissionHandler,
  changeStatus,
  materialController.changeStatus
);

//Materials according to route loadings
router.get(
  "/route-materials",
  permissionHandler,
  materialController.allMaterials
);

//Sync material
router.put("/sync", materialController.syncMaterial);

module.exports = router;
