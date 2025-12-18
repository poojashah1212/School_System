const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profiles");
  },
  filename: (req, file, cb) => {
  const ext = path.extname(file.originalname);
  const name = path.basename(file.originalname, ext);
  cb(null, name + ext);
  }
});
const upload = multer({ storage });
module.exports = upload;
