//Bad request
const error400 = (res, message) => {
  res.status(400).json({
    status: "400",
    message: message,
  });
};

//Bad request with data
const error400withData = (res, message, data) => {
  res.status(400).json({
    status: "400",
    message: message,
    data: data,
  });
};

//Not Found
const error404 = (res, message) => {
  res.status(404).json({
    status: "404",
    message: message,
  });
};

//Already Exists
const error409 = (res, message) => {
  res.status(409).json({
    status: "409",
    message: message,
  });
};

//Server Errors
const error500 = (res, err) => {
  console.log(err);
  return res.status(500).json({
    // message: `Server error`,
    status: "500",
    message: `${err}`,
  });
};

//Custom Error
const customError = (res, statusCode, message) => {
  res.status(statusCode).json({
    status: statusCode,
    message: message,
  });
};

module.exports = {
  error500,
  error404,
  error400,
  error400withData,
  error409,
  customError,
};
