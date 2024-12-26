const { permissionHandler } = require("../../../middlewares/permissionHandler");
const router = require("express").Router();
//controller
const userController = require("../../../controllers/user/user.controller");

//Modals and popup's to get all users and their roles
router.get("/all-roles", permissionHandler, userController.getUsersRoles);

//Get complete information of user [Not been used, now using in the the response when merging]
// router.get("/all-users", userController.getUsers);

module.exports = router;
