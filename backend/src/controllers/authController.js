const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { createHttpError } = require("../middleware/errorHandler");

exports.signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw createHttpError(
        422,
        "Email and password are required.",
        "VALIDATION_ERROR",
      );
    }
    if (password.length < 8) {
      throw createHttpError(
        422,
        "Password must be at least 8 characters.",
        "VALIDATION_ERROR",
      );
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      throw createHttpError(
        409,
        "An account with that email already exists.",
        "EMAIL_TAKEN",
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    req.session.userId = user._id.toString();
    res.status(201).json({ id: user._id, email: user.email });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw createHttpError(
        422,
        "Email and password are required.",
        "VALIDATION_ERROR",
      );
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw createHttpError(
        401,
        "Invalid email or password.",
        "INVALID_CREDENTIALS",
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw createHttpError(
        401,
        "Invalid email or password.",
        "INVALID_CREDENTIALS",
      );
    }

    req.session.userId = user._id.toString();
    res.json({ id: user._id, email: user.email });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("pricingcal.sid");
    res.status(204).end();
  });
};

exports.getMe = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(200).json({ user: null });
    }
    const user = await User.findById(req.session.userId).select("email");
    res.json({ user: user ? { id: user._id, email: user.email } : null });
  } catch (err) {
    next(err);
  }
};
