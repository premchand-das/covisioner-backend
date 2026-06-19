export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const input = schema.shape?.body
        ? {
            body: req.body,
            params: req.params,
            query: req.query,
          }
        : req.body;

      const result = schema.safeParse(input);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      req.validated = result.data;

      if (result.data.body) {
        req.body = result.data.body;
      } else {
        req.body = result.data;
      }

      if (result.data.params) {
        req.params = result.data.params;
      }

      next();
    } catch (error) {
      console.error("VALIDATION MIDDLEWARE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Validation error",
      });
    }
  };
};

export default validate;