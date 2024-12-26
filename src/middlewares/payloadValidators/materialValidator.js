// Imports from packages
const { body, validationResult } = require("express-validator");

const addMaterial = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("code").trim().notEmpty().withMessage("Code is required"),
  body("vat").trim().notEmpty().withMessage("Vat is required"),
  body("group").trim().notEmpty().withMessage("Group is required"),
  body("barCode")
    .trim()
    .optional()
    .notEmpty()
    .withMessage("Bar code cannot be empty if provided"),
  body("unit").trim().notEmpty().withMessage("Unit is required"),
  body("price").trim().notEmpty().withMessage("Price is required"),
  body("duration")
    .trim()
    .optional()
    .notEmpty()
    .withMessage("Duration cannot be empty if provided"),
  body("msds")
    .trim()
    .optional()
    .notEmpty()
    .withMessage("MSDS cannot be empty if provided"),
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
  addMaterial,
};
