const mongoose = require("mongoose");

const warehouseActionMaterialSchema = new mongoose.Schema(
  {
    warehouseActionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WarehouseAction",
      // required: [true, "Warehouse action id is required"],
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
    actualQuantity: {
      type: Number,
      // required: [true, "Actual Quantity is required"],
    },
  },
  {
    timestamps: true,
  }
);

const WarehouseActionMaterial = mongoose.model(
  "WarehouseActionMaterial",
  warehouseActionMaterialSchema
);
module.exports = WarehouseActionMaterial;
