const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { createToken } = require("../services/tokenService");

exports.signup = async (req, res) => {
  try {
    const {
      userId,
      fullName,
      email,
      password,
      city,
      state,
      mobileNo,
      role
    } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    let profileImage = "";
    const file =
      (req.files && req.files.profileImage && req.files.profileImage[0]) ||
      (req.files && req.files.profile && req.files.profile[0]) ||
      (req.files && req.files.avatar && req.files.avatar[0]);
    if (file) profileImage = file.path;


    const user = await User.create({
      userId,
      fullName,
      email,
      password: hashed,
      city,
      state,
      mobileNo,
      role: role || "student",
      profileImage
    });

    res.status(201).json({
      message: "User created",
      user
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid Credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid Credentials" });

    const token = createToken(user);

    res.json({ message: "Login success", token, user });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
};