const mongoose = require("mongoose");

const warehouseActionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Input", "Output", "Move", "Invoice", "Return", "Cancel"],
      required: [true, "Type is required"],
    },
    docNo: {
      type: String,
      required: [true, "Doc no is required"],
      unique: true,
    },
    docDate: {
      type: Date,
      required: [true, "Doc date is required"],
    },
    qrCode: {
      type: String,
      required: [true, "QR code is required"],
      unique: true,
    },
    importToWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      // required: [true, "Warehouse id is required"],
    },
    exportFromWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      // required: [true, "Warehouse id is required"],
    },
    checkFromWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      // required: [true, "Warehouse id is required"],
    },
    totalQuantity: {
      type: Number,
      default: 0,
    },
    totalActualQuantity: {
      type: Number,
    },
    note: {
      type: String,
      // required: [true, "Note is required"],
    },
    status: {
      type: String,
      enum: ["Complete", "Cancel", "Pending"],
      default: "Complete",
      required: [true, "Status is required"],
    },
    warehouseActionMaterialIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WarehouseActionMaterial",
      },
    ],
    documents: [
      {
        name: {
          type: String,
          required: [true, "Name of document is required"],
        },
        format: {
          type: String,
          required: [true, "Format of document is required"],
        },
        location: {
          type: String,
          required: [true, "Location of document is required"],
        },
        key: {
          type: String,
          required: [true, "Key of document is required"],
        },
      },
    ],
    createdById: {
      type: String,
      required: [true, "Created by user id is required"],
    },
  },
  {
    timestamps: true,
  }
);

const WarehouseAction = mongoose.model(
  "WarehouseAction",
  warehouseActionSchema
);
module.exports = WarehouseAction;
