const mongoose = require("mongoose");

const taskCommentsSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    title: {
      type: String,
    },
    picture: {
      name: {
        type: String,
        required: false,
        default: "",
      },
      format: {
        type: String,
        required: false,
        default: "",
      },
      location: {
        type: String,
        required: false,
        default: "",
      },
      key: {
        type: String,
        required: false,
        default: "",
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

const TaskComment = mongoose.model("TaskComment", taskCommentsSchema);
module.exports = TaskComment;
