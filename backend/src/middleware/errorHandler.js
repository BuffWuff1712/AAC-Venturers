export function errorHandler(error, req, res, next) {
  console.error(error);
  res.status(500).json({
    message: error.message || "Unexpected server error.",
  });
}
