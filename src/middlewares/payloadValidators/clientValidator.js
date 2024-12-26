// Imports from packages
const { body, validationResult } = require("express-validator");

const addClient = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("jobType").trim().notEmpty().withMessage("Job type is required"),
  body("taxId").trim().notEmpty().withMessage("Task id is required"),
  body("taxOffice").trim().notEmpty().withMessage("Task office is required"),
  body("address").trim().notEmpty().withMessage("Address is required"),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("postalCode").trim().notEmpty().withMessage("Postal code is required"),
  body("region").optional().trim().notEmpty().withMessage("Region is required"),
  body("country").trim().notEmpty().withMessage("Country is required"),
  body("code").trim().notEmpty().withMessage("Code is required"),
  body("route").trim().notEmpty().withMessage("Route is required"),
  body("salesman").trim().notEmpty().withMessage("Salesman is required"),
  body("comment")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Comment cannot be empty if provided"),
  body("devices")
    .optional()
    .custom((value) => {
      const parsedValue = JSON.parse(value);
      if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
        throw new Error("Devices must be an array and cannot be empty");
      }
      return true;
    }),
  // body("contactInfo")
  //   .notEmpty()
  //   .withMessage("Contact information is required")
  //   .bail()
  //   .custom((value) => {
  //     const parsedValue = JSON.parse(value);
  //     if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
  //       throw new Error("Contact Info must be an array and cannot be null");
  //     }
  //     return true;
  //   }),
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

const editClient = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("jobType").trim().notEmpty().withMessage("Job type is required"),
  body("taxId").trim().notEmpty().withMessage("Task id is required"),
  body("taxOffice").trim().notEmpty().withMessage("Task office is required"),
  body("address").trim().notEmpty().withMessage("Address is required"),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("postalCode").trim().notEmpty().withMessage("Postal code is required"),
  body("region").optional().trim().notEmpty().withMessage("Region is required"),
  body("country").trim().notEmpty().withMessage("Country is required"),
  body("code").trim().notEmpty().withMessage("Code is required"),
  body("route").trim().notEmpty().withMessage("Route is required"),
  body("salesman").trim().notEmpty().withMessage("Salesman is required"),
  body("devices")
    .custom((value) => {
      const parsedValue = JSON.parse(value);
      if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
        throw new Error("Devices must be an array and cannot be empty");
      }
      return true;
    })
    .withMessage("Devices is required and must be an array"),
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

const addStore = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("address").trim().notEmpty().withMessage("Address is required"),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("postalCode").trim().notEmpty().withMessage("Postal code is required"),
  body("region").optional().trim().notEmpty().withMessage("Region is required"),
  body("country").trim().notEmpty().withMessage("Country is required"),
  body("code").trim().notEmpty().withMessage("Code is required"),
  body("route").trim().notEmpty().withMessage("Route is required"),
  body("salesman").trim().notEmpty().withMessage("Salesman is required"),
  body("comment")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Comment is required"),
  body("devices")
    .optional()
    .custom((value) => {
      const parsedValue = JSON.parse(value);
      if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
        throw new Error("Devices must be an array and cannot be empty");
      }
      return true;
    }),
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

const editStore = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("address").trim().notEmpty().withMessage("Address is required"),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("postalCode").trim().notEmpty().withMessage("Postal code is required"),
  body("region").optional().trim().notEmpty().withMessage("Region is required"),
  body("country").trim().notEmpty().withMessage("Country is required"),
  body("code").trim().notEmpty().withMessage("Code is required"),
  body("route").trim().notEmpty().withMessage("Route is required"),
  body("salesman").trim().notEmpty().withMessage("Salesman is required"),
  body("devices")
    .custom((value) => {
      const parsedValue = JSON.parse(value);
      if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
        throw new Error("Devices must be an array and cannot be empty");
      }
      return true;
    })
    .withMessage("Devices is required and must be an array"),
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
  addClient,
  editClient,
  addStore,
  editStore,
};
