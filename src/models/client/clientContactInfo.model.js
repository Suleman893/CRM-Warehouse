const mongoose = require("mongoose");

const contactInfoSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
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
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ClientContactInfo = mongoose.model(
  "ClientContactInfo",
  contactInfoSchema
);
module.exports = ClientContactInfo;
