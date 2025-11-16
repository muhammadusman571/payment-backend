const jwt = require("jsonwebtoken");
const { Admin } = require("../models");

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // Or return res.status(401)... if you want to block access without token
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);

    const admin = await Admin.findByPk(decoded.id);

    if (!admin || admin.status !== "active") {
      return res.status(401).json({
        success: false,
        logout: true,
        message: "User not found or user not active",
        status: 401,
      });
    }

    const tokenIssuedAt = new Date(decoded.iat * 1000);
    const passwordUpdatedAt = new Date(admin?.passwordUpdatedAt);

    tokenIssuedAt.setSeconds(0, 0);
    passwordUpdatedAt.setSeconds(0, 0);

    console.log(tokenIssuedAt, passwordUpdatedAt);

    if (tokenIssuedAt < passwordUpdatedAt) {
      return res.status(401).json({
        success: false,
        logout: true,
        message: "Session expired due to password change",
        status: 401,
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      logout: true,
      message: "Please authenticate as admin",
      status: 401,
    });
  }
};

module.exports = adminAuth;
