const mongoose = require("mongoose");

const warehouseMaterialSchema = new mongoose.Schema(
  {
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      // required: [true, "Warehouse id is required"],
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: [true, "Material id is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
    },
  },
  {
    timestamps: true,
  }
);

const WarehouseMaterial = mongoose.model(
  "WarehouseMaterial",
  warehouseMaterialSchema
);
module.exports = WarehouseMaterial;
