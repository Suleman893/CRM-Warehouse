const checkFile = (req, res, next) => {
  if (!req.files || !req.files.file || !req.files.file.length === 0) {
    return res.status(400).json({ error: "File is required" });
  }
  next();
};

const checkFiles = (req, res, next) => {
  if (!req.files || !req.files.files || !req.files.files.length === 0) {
    return res.status(400).json({ error: "Files are required" });
  }
  next();
};

module.exports = { checkFile, checkFiles };
