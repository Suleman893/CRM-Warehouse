// Imports from packages
const { body, validationResult } = require("express-validator");

const addWarehouse = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("code").trim().notEmpty().withMessage("Code is required"),
  body("assignTo")
    .custom((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error("assignTo must be an array and cannot be empty");
      }
      return true;
    })
    .withMessage("AssignTo is required and must be a non-empty array"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("type")
    .trim()
    .isIn(["Primary", "Secondary", "Vehicle"])
    .withMessage("Type must be either Primary, Secondary or Vehicle"),
  body("route").trim().notEmpty().withMessage("Route is required"),
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

const importWarehouseAction = [
  body("docNo").trim().notEmpty().withMessage("Document number is required"),
  body("docDate").trim().notEmpty().withMessage("Document date is required"),
  body("qrCode").trim().notEmpty().withMessage("QR Code is required"),
  body("importToWarehouse")
    .trim()
    .notEmpty()
    .withMessage("Warehouse id to import is required"),
  body("totalQuantity")
    .trim()
    .notEmpty()
    .withMessage("Total quantity is required"),
  body("materials")
    .custom((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error("Materials must be an array and cannot be empty");
      }
      return true;
    })
    .withMessage("Materials is required and must be an array"),
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

const exportWarehouseAction = [
  body("docNo").trim().notEmpty().withMessage("Document number is required"),
  body("docDate").trim().notEmpty().withMessage("Document date is required"),
  body("qrCode").trim().notEmpty().withMessage("QR Code is required"),
  body("exportFromWarehouse")
    .trim()
    .notEmpty()
    .withMessage("Warehouse id to export is required"),
  body("totalQuantity")
    .trim()
    .notEmpty()
    .withMessage("Total quantity is required"),
  body("materials")
    .custom((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error("Materials must be an array and cannot be empty");
      }
      return true;
    })
    .withMessage("Materials is required and must be an array"),
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

const transferWarehouseAction = [
  body("docNo").trim().notEmpty().withMessage("Document number is required"),
  body("docDate").trim().notEmpty().withMessage("Document date is required"),
  body("qrCode").trim().notEmpty().withMessage("QR Code is required"),
  body("importToWarehouse")
    .trim()
    .notEmpty()
    .withMessage("Warehouse id to import is required"),
  body("exportFromWarehouse")
    .trim()
    .notEmpty()
    .withMessage("Warehouse id to export is required"),
  body("totalQuantity")
    .trim()
    .notEmpty()
    .withMessage("Total quantity is required"),
  body("materials")
    .custom((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error("Materials must be an array and cannot be empty");
      }
      return true;
    })
    .withMessage("Materials is required and must be an array"),
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

const checkWarehouseAction = [
  body("docNo").trim().notEmpty().withMessage("Document number is required"),
  body("docDate").trim().notEmpty().withMessage("Document date is required"),
  body("qrCode").trim().notEmpty().withMessage("QR Code is required"),
  body("checkFromWarehouse")
    .trim()
    .notEmpty()
    .withMessage("Warehouse id to check is required"),
  body("totalQuantity")
    .trim()
    .notEmpty()
    .withMessage("Total quantity is required"),
  body("materials")
    .custom((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error("Materials must be an array and cannot be empty");
      }
      return true;
    })
    .withMessage("Materials is required and must be an array"),
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

const assignVehicle = [
  body("vehicle").trim().notEmpty().withMessage("Vehicle is required"),
  body("user").trim().notEmpty().withMessage("User is required"),
  body("route").trim().notEmpty().withMessage("Route is required"),
  body("materials")
    .custom((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error("materials must be an array and cannot be empty");
      }
      return true;
    })
    .withMessage("Materials is required and must be a non-empty array"),
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

const changeType = [
  body("type")
    .trim()
    .notEmpty()
    .withMessage("Type is required")
    .isIn(["Primary", "Secondary", "Vehicle"])
    .withMessage(
      "Type must be one of the following values: Primary, Secondary or Vehicle"
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
    .isIn(["Complete", "Cancel"])
    .withMessage(
      "Status must be one of the following values: Complete, Cancel"
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
  addWarehouse,
  importWarehouseAction,
  exportWarehouseAction,
  transferWarehouseAction,
  checkWarehouseAction,
  changeType,
  changeStatus,
  assignVehicle,
};
