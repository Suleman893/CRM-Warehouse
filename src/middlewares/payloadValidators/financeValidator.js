const { body, validationResult } = require("express-validator");

const createInvoice = [
  body("invoiceNo").trim().notEmpty().withMessage("Invoice number is required"),
  body("invoiceDate").trim().notEmpty().withMessage("Invoice date is required"),
  body("qrCode").trim().notEmpty().withMessage("QR Code is required"),
  body("paymentMethod")
    .trim()
    .isIn(["Cash", "CreditCard", "BankTransfer", "Check"])
    .withMessage(
      "Payment method must be one of Cash, CreditCard, BankTransfer, Check"
    ),
  body("client").trim().notEmpty().withMessage("Client is required"),
  body("invoiceDueDate")
    .trim()
    .notEmpty()
    .withMessage("Invoice due date is required"),
  body("totalAmount")
    .trim()
    .notEmpty()
    .withMessage("Total amount is required")
    .isNumeric()
    .withMessage("Total amount must be a numeric value"),
  body("discountTotal")
    .trim()
    .notEmpty()
    .withMessage("Discount total is required")
    .isNumeric()
    .withMessage("Discount total must be a numeric value"),
  body("vatTotal")
    .trim()
    .notEmpty()
    .withMessage("VAT total is required")
    .isNumeric()
    .withMessage("VAT total must be a numeric value"),
  body("shipping")
    .trim()
    .notEmpty()
    .withMessage("Shipping is required")
    .isNumeric()
    .withMessage("Shipping must be a numeric value"),
  body("invoiceTotal")
    .trim()
    .notEmpty()
    .withMessage("Invoice total is required")
    .isNumeric()
    .withMessage("Invoice total must be a numeric value"),
  body("materials")
    .isArray({ min: 1 })
    .withMessage("Materials must be a non-empty array"),
  body("note").optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
    } else {
      return res
        .status(400)
        .json({ errors: errors.array().map((error) => error.msg) });
    }
  },
];

const createReceipt = [
  body("receiptNo").trim().notEmpty().withMessage("Receipt number is required"),
  body("qrCode").trim().notEmpty().withMessage("QR Code is required"),
  body("receiptDate").trim().notEmpty().withMessage("Receipt date is required"),
  body("amount").trim().notEmpty().withMessage("Amount is required"),
  body("note").optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
    } else {
      return res
        .status(400)
        .json({ errors: errors.array().map((error) => error.msg) });
    }
  },
];

const editReceipt = [
  body("receiptDate").trim().notEmpty().withMessage("Receipt date is required"),
  body("amount").trim().notEmpty().withMessage("Amount is required"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
    } else {
      return res
        .status(400)
        .json({ errors: errors.array().map((error) => error.msg) });
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
  createInvoice,
  editReceipt,
  createReceipt,
  changeStatus,
};
