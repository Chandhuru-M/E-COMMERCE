const catchAsyncError = require("../middlewares/catchAsyncError");
const chatAssistantAgent = require("../agents/chatAssistantAgent");

exports.chatAssistant = catchAsyncError(async (req, res, next) => {
  const { message } = req.body;
  
  // Build session context
  const session = {
    user: req.user ? { _id: req.user._id, name: req.user.name } : null,
    cart: [] // In a real app, fetch cart from DB
  };

  // Delegate to the AI Agent
  const response = await chatAssistantAgent.handleUserMessage(message, session);

  res.status(200).json(response);
});

