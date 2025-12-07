const catchAsyncError = require("../middlewares/catchAsyncError");
const serviceAgent = require("../agents/serviceAgent");

exports.chatAssistant = catchAsyncError(async (req, res, next) => {
  const { message } = req.body;

  // Use the Service Agent to handle the request
  // We pass req.user if it exists, otherwise the agent uses mock data
  const response = await serviceAgent.handleRequest(message, req.user);

  res.status(200).json({
    success: true,
    reply: response.reply,
    data: response.data,
    intent: response.intent
  });
});
