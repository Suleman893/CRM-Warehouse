const multer = require("multer");
const path = require("path");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, //100mb
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();
    if (
      ext !== ".jpg" &&
      ext !== ".jpeg" &&
      ext !== ".png" &&
      ext !== ".pdf" &&
      ext !== ".xlsx" &&
      ext !== ".csv"
    ) {
      const error = new Error("File type is not supported");
      error.code = "UNSUPPORTED_FILE_TYPE";
      return cb(error, false);
    }
    cb(null, true);
  },
});

// Handle single and multiple files in the same request
const uploadFiles = upload.fields([
  { name: "file", maxCount: 1 }, // Single file
  { name: "files", maxCount: 10 }, // Multiple files
]);

module.exports = { uploadFiles };
