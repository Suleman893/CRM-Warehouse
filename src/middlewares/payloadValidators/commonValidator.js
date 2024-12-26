// Imports from packages
const { body, validationResult } = require("express-validator");

const addComment = [
  body("comment").trim().notEmpty().withMessage("Comment is required"),
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

const changePriority = [
  body("priority")
    .trim()
    .notEmpty()
    .withMessage("Priority is required")
    .isIn(["Low", "Medium", "High"])
    .withMessage(
      "Priority must be one of the following values: Low, Medium, High"
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

const changeStatus = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["Active", "InActive"])
    .withMessage(
      "Status must be one of the following values: Active, InActive"
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
  addComment,
  changePriority,
  changeStatus,
};
