import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    question: {
      type: String,
      required: [true, 'Please provide user question message'],
    },
    answer: {
      type: String,
      required: [true, 'Please provide assistant answer content'],
    },
    sessionId: {
      type: String,
      required: [true, 'Please provide conversation session ID'],
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

export default ChatHistory;
