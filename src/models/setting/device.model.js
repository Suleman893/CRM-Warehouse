const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    description: {
      type: String,
    },
    capacity: {
      type: Number,
      default: null,
    },
    group: {
      type: String,
      enum: ["Machine", "Device", "Trap"],
      required: [true, "Group is required"],
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

const Device = mongoose.model("Device", deviceSchema);
module.exports = Device;
