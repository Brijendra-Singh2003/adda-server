const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next)
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message
      });
    }
  };
};

module.exports = {
  asyncHandler,
}