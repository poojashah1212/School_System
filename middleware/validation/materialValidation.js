const { body, validationResult } = require("express-validator");

const materialCreate = [
    body("title")
        .trim()
        .notEmpty()
        .withMessage("Title is required")
        .isLength({ min: 3, max: 100 })
        .withMessage("Title must be between 3 and 100 characters"),
    
    body("type")
        .notEmpty()
        .withMessage("Type is required")
        .isIn(["PDF", "DOC", "MP4", "VIDEO"])
        .withMessage("Type must be either PDF, DOC, MP4, or VIDEO"),
    
    body("classId")
        .notEmpty()
        .withMessage("Class is required"),
    
    body("subject")
        .trim()
        .notEmpty()
        .withMessage("Subject is required")
];

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }
    next();
};

module.exports = {
    materialCreate,
    validate
};
