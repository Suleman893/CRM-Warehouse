const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    title: {
      type: String,
    },
    picture: {
      name: {
        type: String,
        required: [true, "Name of picture is required"],
      },
      format: {
        type: String,
        required: [true, "Format of picture is required"],
      },
      location: {
        type: String,
        required: [true, "Location of picture is required"],
      },
      key: {
        type: String,
        required: [true, "Key of picture is required"],
      },
    },
    commentById: {
      type: String,
      required: [true, "Comment by Id is required"],
    },
  },
  {
    timestamps: true,
  }
);

const OrderComment = mongoose.model("OrderComment", commentSchema);
module.exports = OrderComment;
