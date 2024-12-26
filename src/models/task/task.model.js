const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client id is required"],
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Task type is required"],
    },
    assignToIds: [
      {
        type: String,
        required: [true, "Assign to ids is required"],
      },
    ],
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
      required: [true, "Priority is required"],
    },
    status: {
      type: String,
      enum: ["Pending", "InProgress", "Completed", "Declined", "Canceled"],
      default: "InProgress",
      required: [true, "Status is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    dueDate: {
      type: Date,
    },
    commentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TaskComment",
      },
    ],
    activityIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TaskActivity",
      },
    ],
    createdById: {
      type: String,
      required: [true, "Created by user id is required"],
    },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
