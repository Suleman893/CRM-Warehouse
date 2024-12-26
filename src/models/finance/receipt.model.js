const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    //Invoice id is only required when create receipt from invoice screen
    //When not from invoice page then we wont have invoice id
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      // required: [true, "Invoice id is required"],
    },
    //Client id is only required when creating receipt directly from client detail
    //When make receipt from invoice then from invoice can have client info
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      // required: [true, "Invoice id is required"],
    },
    receiptNo: {
      type: String,
      required: [true, "Receipt no is required"],
    },
    receiptDate: {
      type: Date,
      required: [true, "Receipt date is required"],
    },
    qrCode: {
      type: String,
      required: [true, "QR code is required"],
    },
    //Amount here as the client may not give complete amount.
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    status: {
      type: String,
      enum: ["Cancel", "Complete"],
      default: "Complete",
    },
    note: {
      type: String,
    },
    createdById: {
      type: String,
      required: [true, "CreatedById is required"],
    },
  },
  {
    timestamps: true,
  }
);

const Receipt = mongoose.model("Receipt", receiptSchema);
module.exports = Receipt;
