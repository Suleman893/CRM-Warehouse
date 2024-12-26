// Imports from packages
const { body, validationResult } = require("express-validator");

const addService = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("description")
    .trim()
    .optional()
    .notEmpty()
    .withMessage("Description cannot be empty if provided"),
  body("block")
    .trim()
    .optional()
    .notEmpty()
    .withMessage("Block cannot be empty if provided"),
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
  addService,
};
