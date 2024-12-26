const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client id is required"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
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
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      required: [true, "Route id is required"],
    },
    salesmanId: {
      type: String,
      required: [true, "Salesman id is required"],
    },
    declined: {
      type: Boolean,
      default: false,
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
        ref: "StoreContactInfo",
      },
    ],
    deviceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device",
        required: [true, "Device ids is required"],
      },
    ],
    commentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StoreComment",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Store = mongoose.model("Store", storeSchema);
module.exports = Store;
