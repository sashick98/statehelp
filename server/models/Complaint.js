const mongoose = require('mongoose');

/**
 * Complaint Model
 * 
 * Central collection for citizen grievances.
 * Uses a unique, human-readable reference ID format: TNG-YYYYMMDD-XXXX
 * Supports full lifecycle status transitions:
 * Submitted -> Acknowledged -> Assigned -> In Progress -> Resolved -> Closed (or Reopened)
 */
const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Citizen reference is required'],
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
      index: true,
    },
    district: {
      type: String,
      required: [true, 'Please select district in Tamil Nadu'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Please select complaint category'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Please provide complaint subject'],
      trim: true,
      minlength: [5, 'Subject must be at least 5 characters'],
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide detailed complaint description'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Emergency'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: [
        'Submitted',
        'Acknowledged',
        'Assigned',
        'In Progress',
        'Resolved',
        'Closed',
        'Reopened',
      ],
      default: 'Submitted',
      index: true,
    },
    assignedOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closureFeedback: {
      rating: { type: Number, min: 1, max: 5 },
      comments: { type: String, trim: true },
      submittedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for search across subject, description, and ID
complaintSchema.index({
  complaintId: 'text',
  subject: 'text',
  description: 'text',
  district: 'text',
});

module.exports = mongoose.model('Complaint', complaintSchema);
