const router = require("express").Router();
//controller
const taskController = require("../../controllers/task/taskController");
//helpers
const {
  changePriority,
  addComment,
} = require("../../middlewares/payloadValidators/commonValidator");
const {
  addTask,
  editTask,
  changeTaskStatus,
  addTaskAssignee,
} = require("../../middlewares/payloadValidators/taskValidator");
const { uploadFiles } = require("../../services/helpers/fileHelper");
const { checkFile } = require("../../middlewares/payloadValidators/fileCheck");
const { permissionHandler } = require("../../middlewares/permissionHandler");

//Add task
router.post(
  "/add",
  permissionHandler,
  uploadFiles,
  addTask,
  checkFile,
  taskController.addTask
);

//Add assign to's to the task
router.post(
  "/add-assignee/:id",
  permissionHandler,
  addTaskAssignee,
  taskController.addAssignee
);

//Edit task
router.put(
  "/edit/:id",
  permissionHandler,
  uploadFiles,
  editTask,
  taskController.editTask
);

//All task
router.get("/all", permissionHandler, taskController.allTasks);

//Task by id
router.get("/detail/:id", permissionHandler, taskController.taskDetail);

//Comment on task
router.post(
  "/comment/:id",
  permissionHandler,
  uploadFiles,
  addComment,
  // checkFile,
  taskController.commentOnTask
);

//Change priority
router.patch(
  "/priority/:id",
  permissionHandler,
  changePriority,
  taskController.changePriority
);

//Change status
router.patch(
  "/status/:id",
  permissionHandler,
  changeTaskStatus,
  taskController.changeStatus
);

//Delete task
router.delete("/delete/:id", permissionHandler, taskController.deleteTask);

module.exports = router;
