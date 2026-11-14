function chatRequestErrorHandler(error, req, res, next) {
  if (!req.path.startsWith("/api/chat")) return next(error);
  if (error?.type === "entity.too.large" || error?.status === 413) {
    return res.status(413).json({
      success: false,
      code: "REQUEST_TOO_LARGE",
      message: "Chat request is too large. Shorten the message or conversation history and try again.",
    });
  }
  if (error instanceof SyntaxError && error?.status === 400 && Object.hasOwn(error, "body")) {
    return res.status(400).json({
      success: false,
      code: "INVALID_JSON",
      message: "Request body must contain valid JSON.",
    });
  }
  return next(error);
}

module.exports = chatRequestErrorHandler;
