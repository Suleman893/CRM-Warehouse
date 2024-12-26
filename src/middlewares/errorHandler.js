const multer = require("multer");
const { error400, error500, error409 } = require("../services/helpers/errors");
const { default: mongoose } = require("mongoose");

// Centralized Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  //Multer related error
  if (err instanceof multer.MulterError) {
    return error400(res, err.message);
  }
  if (err.code === "UNSUPPORTED_FILE_TYPE") {
    return error400(res, err.message);
  }
  //Mongoose Validation Error
  if (err instanceof mongoose.Error) {
    return error500(res, "Server error");
  }
  //Duplicate key of mongodb error
  if (err.code === 11000) {
    return error409(res, "Value already exists");
  }
  console.log("The err", err);
  return error500(res, "Server error");
};

module.exports = { errorHandler };
