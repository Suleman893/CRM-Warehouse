const mongoose = require("mongoose");

const orderActivitySchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    title: {
      type: String,
      required: [true, "Title of activity is required"],
    },
    event: {
      type: String,
      required: [true, "Event of activity is required"],
    },
    activityById: {
      type: String,
      required: [true, "Activity by Id is required"],
    },
  },
  {
    timestamps: true,
  }
);

const OrderActivity = mongoose.model("OrderActivity", orderActivitySchema);
module.exports = OrderActivity;
