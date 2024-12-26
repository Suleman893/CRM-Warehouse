const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNo: {
      type: String,
      required: [true, "Order no is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client id is required"],
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task id is required"],
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
    status: {
      type: String,
      enum: [
        "InProgress",
        "Pending",
        "Completed",
        "Declined",
        "Cancel",
        "Schedule",
      ],
      default: "InProgress",
      required: [true, "Status is required"],
    },
    qrCode: {
      type: String,
      required: [true, "QRCode is required"],
    },
    priority: {
      type: String,
      required: [true, "Priority is required"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
    },
    totalVat: {
      type: Number,
      required: [true, "Total vat is required"],
    },
    shippingPrice: {
      type: Number,
      required: [true, "Shipping price is required"],
    },
    orderTotalPrice: {
      type: Number,
      required: [true, "Order total price is required"],
    },
    note: {
      type: String,
    },
    commentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrderComment",
      },
    ],
    activityIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrderActivity",
      },
    ],
    createdById: {
      type: String,
      required: [true, "Created By id is required"],
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
