// Imports from packages
const { body, validationResult } = require("express-validator");

const addTaskAssignee = [
  body("assignTo")
    .isArray({ min: 1 })
    .withMessage("AssignTo must be a non-empty array")
    .custom((value) => value.every((id) => typeof id === "string"))
    .withMessage("Each assignee ID must be a string"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
    } else {
      return res
        .status(400)
        .json({ error: errors.array().map((error) => error.msg) });
    }
  },
];

const addTask = [
  body("client").trim().notEmpty().withMessage("Client id is required"),
  // body("store").trim().notEmpty().withMessage("Store id is required"),
  body("taskType").trim().notEmpty().withMessage("Task type is required"),
  body("assignTo")
    .custom((value) => {
      const parsedValue = JSON.parse(value);
      if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
        throw new Error("AssignTo must be an array and cannot be empty");
      }
      return true;
    })
    .withMessage("AssignTo is required and must be an array"),
  body("startDate").trim().notEmpty().withMessage("Start date is required"),
  body("dueDate")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Due date cannot be empty"),
  body("priority").trim().notEmpty().withMessage("Priority is required"),
  body("comment")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Comment cannot be empty if provided"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
    } else {
      return res
        .status(400)
        .json({ error: errors.array().map((error) => error.msg) });
    }
  },
];

const editTask = [
  body("client").trim().notEmpty().withMessage("Client id is required"),
  // body("store").trim().notEmpty().withMessage("Store id is required"),
  body("taskType").trim().notEmpty().withMessage("Task type is required"),
  body("assignTo")
    .custom((value) => {
      const parsedValue = JSON.parse(value);
      if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
        throw new Error("AssignTo must be an array and cannot be empty");
      }
      return true;
    })
    .withMessage("AssignTo is required and must be an array"),
  body("startDate").trim().notEmpty().withMessage("Start date is required"),
  body("dueDate").trim().notEmpty().withMessage("End date is required"),
  body("priority").trim().notEmpty().withMessage("Priority is required"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
    } else {
      return res
        .status(400)
        .json({ error: errors.array().map((error) => error.msg) });
    }
  },
];

const changeTaskStatus = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["Pending", "InProgress", "Completed", "Declined", "Canceled"])
    .withMessage(
      "Status must be one of the following values: Pending, InProgress, Completed, Declined, Canceled"
    ),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
    } else {
      return res
        .status(400)
        .json({ error: errors.array().map((error) => error.msg) });
    }
  },
];

module.exports = {
  addTask,
  addTaskAssignee,
  editTask,
  changeTaskStatus,
};
