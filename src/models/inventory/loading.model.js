const mongoose = require("mongoose");

const loadingSchema = new mongoose.Schema(
  {
    warehouseActionId: {
      //This is warehouse action id, the document of type transfer and will be in Pending state, use this warehouse action when in loading button of PDF is clicked and transfer document now in Complete status
      type: mongoose.Schema.Types.ObjectId,
      ref: "WarehouseAction",
      required: [true, "Warehouse action id is required"],
    },
    vehicleId: {
      //This is warehouse id, warehouse of type vehicle
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: [true, "Vehicle id is required"],
    },
    assigneeId: {
      type: String,
      required: [true, "Assignee id is required"],
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Route id is required"],
    },
    status: {
      type: String,
      enum: ["Loading", "Unloading"],
    },
  },
  {
    timestamps: true,
  }
);

const Loading = mongoose.model("Loading", loadingSchema);
module.exports = Loading;
