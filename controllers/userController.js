const User = require("../models/user");
const bcrypt = require("bcryptjs");

exports.getAll = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

exports.getOne = async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.status(404).json({ message: "User Not Found" });

  res.json(user);
};

exports.update = async (req, res) => {
  let data = req.body;

  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const user = await User.findByIdAndUpdate(req.params.id, data, {
    new: true
  }).select("-password");

  if (!user) return res.status(404).json({ message: "User Not Found" });

  res.json({ message: "Updated", user });
};

exports.myProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ message: "User Not Found" });
  res.json(user);
};

exports.remove = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User Deleted" });
};