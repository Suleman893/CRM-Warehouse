const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    code: {
      type: String,
      required: [true, "Code is required"],
    },
    picture: {
      name: {
        type: String,
        // required: [true, "Name of picture is required"],
      },
      format: {
        type: String,
        // required: [true, "Format of picture is required"],
      },
      location: {
        type: String,
        // required: [true, "Location of picture is required"],
      },
      key: {
        type: String,
        // required: [true, "Key of picture is required"],
      },
    },
    vat: {
      type: Number,
      required: [true, "VAT is required"],
      default: 0,
    },
    group: {
      type: String,
      required: [true, "Group is required"],
    },
    barCode: {
      type: String,
      default: "",
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    duration: {
      type: Number,
      default: null,
    },
    msds: {
      type: Date,
      default: null,
    },
    documents: {
      type: [
        {
          name: {
            type: String,
            required: [true, "Name of document is required"],
          },
          format: {
            type: String,
            required: [true, "Format of document is required"],
          },
          location: {
            type: String,
            required: [true, "Location of document is required"],
          },
          key: {
            type: String,
            required: [true, "Key of document is required"],
          },
        },
      ],
      default: [],
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

const Material = mongoose.model("Material", materialSchema);
module.exports = Material;
