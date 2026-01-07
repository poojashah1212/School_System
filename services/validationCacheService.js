const { body } = require("express-validator");

// Cache validation rules to avoid recreating them on each request
const validationCache = new Map();

const getSignupValidation = () => {
  if (validationCache.has('signup')) {
    return validationCache.get('signup');
  }

  const validation = [
    body("fullName")
      .trim()
      .notEmpty()
      .withMessage("Full name is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("Full name must be between 2 and 50 characters"),

    body("userId")
      .trim()
      .notEmpty()
      .withMessage("User ID is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("User ID must be between 3 and 20 characters"),

    body("email")
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail(),

    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),

    body("age")
      .isInt({ min: 1, max: 120 })
      .withMessage("Age must be between 1 and 120"),

    body("city")
      .trim()
      .notEmpty()
      .withMessage("City is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("City name must be between 2 and 50 characters"),

    body("state")
      .trim()
      .notEmpty()
      .withMessage("State is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("State name must be between 2 and 50 characters"),

    body("mobileNo")
      .matches(/^[0-9]{10}$/)
      .withMessage("Mobile number must be exactly 10 digits"),

    body("role")
      .optional()
      .isIn(["student", "teacher"])
      .withMessage("Role must be either 'student' or 'teacher'"),

    body("class")
      .if(body("role").equals("student"))
      .notEmpty()
      .withMessage("Class is required for students"),

    // Profile image validation
    body("profileImage")
      .optional()
      .custom((value, { req }) => {
        const file = req.files?.profileImage?.[0] || req.files?.profile?.[0] || req.files?.avatar?.[0];

        if (!file) return true; // Optional field

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Profile image size must be less than 5MB");
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
          throw new Error("Profile image must be JPEG, PNG, GIF, or WebP format");
        }

        return true;
      })
      .withMessage("Invalid profile image")
  ];

  validationCache.set('signup', validation);
  return validation;
};

const getLoginValidation = () => {
  if (validationCache.has('login')) {
    return validationCache.get('login');
  }

  const validation = [
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail(),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
  ];

  validationCache.set('login', validation);
  return validation;
};

module.exports = {
  getSignupValidation,
  getLoginValidation
};
