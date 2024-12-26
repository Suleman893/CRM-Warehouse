// Imports from packages
const { body, validationResult } = require("express-validator");

const addOrder = [
  body("orderNo").trim().notEmpty().withMessage("Order no is required"),
  body("client").trim().notEmpty().withMessage("Client is required"),
  // body("store").trim().notEmpty().withMessage("Store is required"),
  body("task").trim().notEmpty().withMessage("Task is required"),
  body("materials")
    .custom((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error("Materials must be an array and cannot be empty");
      }
      return true;
    })
    .withMessage("Materials is required and must be an array"),
  body("qrCode").trim().notEmpty().withMessage("Qr code is required"),
  body("priority").trim().notEmpty().withMessage("Priority is required"),
  body("totalAmount").trim().notEmpty().withMessage("Total amount is required"),
  body("totalVat").trim().notEmpty().withMessage("Total VAT is required"),
  body("shippingPrice")
    .trim()
    .notEmpty()
    .withMessage("Shipping price is required"),
  body("orderTotalPrice")
    .trim()
    .notEmpty()
    .withMessage("Order total price is required"),
  body("note").trim().notEmpty().withMessage("Note is required"),
  body("startDate").trim().notEmpty().withMessage("Start date is required"),
  body("dueDate").trim().notEmpty().withMessage("End date is required"),
  //   body("file").trim().notEmpty().withMessage("File is required"),
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

const editOrder = [
  body("materials")
    .custom((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error("Materials must be an array and cannot be empty");
      }
      return true;
    })
    .withMessage("Materials is required and must be an array"),
  body("priority").trim().notEmpty().withMessage("Priority is required"),
  body("totalAmount").trim().notEmpty().withMessage("Total amount is required"),
  body("totalVat").trim().notEmpty().withMessage("Total VAT is required"),
  body("shippingPrice")
    .trim()
    .notEmpty()
    .withMessage("Shipping price is required"),
  body("orderTotalPrice")
    .trim()
    .notEmpty()
    .withMessage("Order total price is required"),
  body("startDate").trim().notEmpty().withMessage("Start date is required"),
  body("dueDate").trim().notEmpty().withMessage("End date is required"),
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

const changeOrderStatus = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn([
      "InProgress",
      "Pending",
      "Completed",
      "Declined",
      "Cancel",
      "Schedule",
    ])
    .withMessage(
      "Status must be one of the following values: InProgress, Pending, Completed, Declined, Cancel, Schedule"
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
  addOrder,
  editOrder,
  changeOrderStatus,
};
