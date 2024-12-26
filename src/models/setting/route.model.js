const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    description: {
      type: String,
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

const Route = mongoose.model("Route", routeSchema);
module.exports = Route;
