const mongoose = require("mongoose");

const contactInfoSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
    },
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    phoneNumbers: [
      {
        type: {
          type: String,
          enum: ["Home", "Work", "Mobile"],
        },
        number: {
          type: String,
          required: [true, "Number is required"],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const StoreContactInfo = mongoose.model("StoreContactInfo", contactInfoSchema);
module.exports = StoreContactInfo;
