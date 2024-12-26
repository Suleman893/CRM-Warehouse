const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    jobType: {
      type: String,
      required: [true, "Job type is required"],
    },
    taxId: {
      type: String,
      required: [true, "Tax id is required"],
    },
    taxOffice: {
      type: String,
      required: [true, "Tax office is required"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    postalCode: {
      type: String,
      required: [true, "Postal code is required"],
    },
    region: {
      type: String,
      required: [true, "Region is required"],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
    },
    code: {
      type: String,
      required: [true, "Code is required"],
    },
    declined: {
      type: Boolean,
      default: false,
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      required: [true, "Route id is required"],
    },
    salesmanId: {
      type: String,
      required: [true, "Salesman id is required"],
    },
    status: {
      type: String,
      enum: ["Active", "InActive"],
      default: "Active",
      required: [true, "Status is required"],
    },
    contactInfoIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClientContactInfo",
      },
    ],
    deviceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device",
        required: [true, "Device ids is required"],
      },
    ],
    storeIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
      },
    ],
    commentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClientComment",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Client = mongoose.model("Client", clientSchema);
module.exports = Client;
