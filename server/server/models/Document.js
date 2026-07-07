import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide file name'],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, 'Please provide original name'],
    },
    path: {
      type: String,
      required: [true, 'Please provide file storage path'],
    },
    size: {
      type: Number,
      required: [true, 'Please provide file size in bytes'],
    },
    type: {
      type: String,
      required: [true, 'Please provide file extension type'],
      uppercase: true,
      enum: ['PDF', 'DOCX', 'TXT'],
    },
    status: {
      type: String,
      enum: ['uploaded', 'processed', 'processing', 'indexed', 'failed'],
      default: 'uploaded',
    },
    content: {
      type: String,
      default: '',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model('Document', documentSchema);

export default Document;
