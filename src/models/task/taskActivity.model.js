const mongoose = require("mongoose");

const taskActivitySchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
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

const TaskActivity = mongoose.model("TaskActivity", taskActivitySchema);
module.exports = TaskActivity;
