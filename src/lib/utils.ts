export const asyncHandler = (fn: any) => {
  return async (req: any, res: any, next: any) => {
    try {
      await fn(req, res, next);
    } catch (error: any) {
      res.status(500).json({
        message: "Internal Server Error",
        details: error.message
      });
    }
  };
};