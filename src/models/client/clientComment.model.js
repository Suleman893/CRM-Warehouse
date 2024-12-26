const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
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
      required: [true, "Comment By Id is required"],
    },
  },
  {
    timestamps: true,
  }
);

const ClientComment = mongoose.model("ClientComment", commentSchema);
module.exports = ClientComment;
