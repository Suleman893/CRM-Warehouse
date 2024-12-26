const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: {
      type: String,
      required: [true, "Invoice number is required"],
    },
    invoiceDate: {
      type: Date,
      required: [true, "Invoice date is required"],
    },
    qrCode: {
      type: String,
      required: [true, "QR code is required"],
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "CreditCard", "Cash", "BankTransfer", "Check"],
      required: [true, "Payment method is required"],
    },
    //Invoice for
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client id is required"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Invoice total amount is required"],
    },
    invoiceDueDate: {
      type: Date,
      required: [true, "Invoice due date is required"],
    },
    materials: [
      {
        materialId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Material",
          required: [true, "Material id is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Material quantity is required"],
        },
        price: {
          type: Number,
          required: [true, "Material price is required"],
        },
        discount: {
          type: String,
          required: [true, "Material discount is required"],
        },
        vat: {
          type: String,
          required: [true, "Material vat is required"],
        },
        amount: {
          type: Number,
          required: [true, "Material amount is required"],
        },
      },
    ],
    discountTotal: {
      type: Number,
      required: [true, "Discount total is required"],
    },
    vatTotal: {
      type: Number,
      required: [true, "Vat total is required"],
    },
    shipping: {
      type: Number,
      required: [true, "Shipping is required"],
    },
    //Total of all of the amounts
    invoiceTotal: {
      type: Number,
      required: [true, "Invoice total is required"],
    },
    note: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Cancel", "Complete"],
      default: "Complete",
    },
    //Represented as salesman
    createdById: {
      type: String,
      required: [true, "Created by id is required"],
    },
  },
  {
    timestamps: true,
  }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);
module.exports = Invoice;
