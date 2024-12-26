const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Warehouse name is required"],
    },
    code: {
      type: String,
      required: [true, "Code is required"],
    },
    assignToIds: [
      {
        type: String,
        required: [true, "Assign to ids is required"],
      },
    ],
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: ["Primary", "Secondary", "Vehicle"],
      required: [true, "Type is required"],
    },
    warehouseActionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WarehouseAction",
        default: [],
      },
    ],
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      required: [true, "Route is required"],
    },
    warehouseMaterialIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WarehouseMaterial",
      },
    ],
    totalQuantity:{
      type:Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["Active", "InActive"],
      default: "Active",
      required: [true, "Status is required"],
    },
  },
  {
    timestamps: true,
  }
);

const Warehouse = mongoose.model("Warehouse", warehouseSchema);
module.exports = Warehouse;
