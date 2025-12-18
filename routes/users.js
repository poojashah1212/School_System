const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const upload = require("../middleware/upload"); 
const { studentUpdate } = require("../middleware/validation/userValidation"); 
const { updateStudent } = require("../controllers/teacherController"); 

const userController = require("../controllers/userController");
const { runValidation } = require("../middleware/validate");

router.use(auth);


router.get("/", userController.getAll);
router.get("/:id", userController.getOne);

router.put("/students/:userId", upload.single("image"), studentUpdate, runValidation, updateStudent);

router.delete("/:id", userController.remove);

module.exports = router;
