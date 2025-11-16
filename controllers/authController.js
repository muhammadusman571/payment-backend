const { User, Admin } = require("../models");
const jwt = require("jsonwebtoken");
const { sendForGetPasswordEmail } = require("../utils/mailer");
const bcrypt = require("bcryptjs"); // ✅ Already added

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists with the provided email
    const user = await Admin.findOne({ where: { email: email } });
    if (!user) {
      return res
        .status(404)
        .json({ error: "No account found with that email address" });
    }

    const resetToken = jwt.sign(
      { email: user.email, userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const resetLink = `${process.env.CLIENT_URL}reset-password?token=${resetToken}`;

    await sendForGetPasswordEmail(email, "Password Reset Request", resetLink);
    res.status(200).json({
      message:
        "Password reset link sent successfully. Please check your email.",
    });
  } catch (error) {
    console.error("Error sending reset link:", error);
    res.status(500).json({ error: "Server error, please try again later." });
  }
};
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token is missing." });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId, email } = decoded;

    // Find the user (admin) by email or ID
    const user = await Admin.findOne({
      where: {
        id: userId,
        email: email,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Invalid or expired token." });
    }

    // Update the password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    return res
      .status(200)
      .json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Reset Password Error:", error.message);
    return res.status(400).json({ error: "Invalid or expired token." });
  }
};
