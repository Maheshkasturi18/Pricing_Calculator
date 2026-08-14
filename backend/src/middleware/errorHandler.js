function errorHandler(err, req, res, next) {
  if (err.name === "CalculationError") {
    return res.status(422).json({
      error: { message: err.message, code: "VALIDATION_ERROR", field: err.field },
    });
  }

  if (err.name === "ValidationError") {
    const firstMessage = Object.values(err.errors)[0]?.message || "Validation failed";
    return res.status(422).json({
      error: { message: firstMessage, code: "VALIDATION_ERROR" },
    });
  }

  if (err.status) {
    return res.status(err.status).json({
      error: { message: err.message, code: err.code || "REQUEST_ERROR" },
    });
  }

  console.error(err);
  return res.status(500).json({
    error: { message: "Something went wrong on our end. Please try again.", code: "INTERNAL_ERROR" },
  });
}


function createHttpError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

module.exports = { errorHandler, createHttpError };
