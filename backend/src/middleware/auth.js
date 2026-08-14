function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: {
        message: "You must be logged in to do this.",
        code: "NOT_AUTHENTICATED",
      },
    });
  }
  next();
}

module.exports = { requireAuth };
