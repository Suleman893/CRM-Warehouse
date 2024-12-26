// Imports from packages
const { body, validationResult } = require("express-validator");

const addDevice = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Description should not be empty if provided"),
  body("group")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Group should not be empty if provided"),
  body("capacity")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Capacity should not be empty if provided"),
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
  addDevice,
};
