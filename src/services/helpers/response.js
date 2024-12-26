//Success response
const status200 = (res, message = "Success") => {
  res.status(200).json({
    status: "200",
    message,
  });
};

//Success response with data
const success = (res, statusCode, message, data) => {
  res.status(200).json({
    status: statusCode,
    message: message,
    data: data,
  });
};

module.exports = {
  success,
  status200,
};
