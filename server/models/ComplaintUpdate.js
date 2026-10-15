const mongoose = require('mongoose');

/**
 * ComplaintUpdate Model
 * 
 * Audit Trail & Timeline:
 * Records every status transition and official remark.
 * Strictly separates 'publicMessage' (visible to citizen) from 'internalNote' (confidential to officers/admins).
 */
const complaintUpdateSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true,
    },
    referenceId: {
      type: String,
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorRole: {
      type: String,
      enum: ['citizen', 'officer', 'admin', 'system'],
      default: 'system',
    },
    previousStatus: {
      type: String,
      required: true,
    },
    newStatus: {
      type: String,
      required: true,
    },
    publicMessage: {
      type: String,
      required: [true, 'Public message for the citizen is required'],
      trim: true,
    },
    internalNote: {
      type: String,
      trim: true,
      default: '', // Confidential note for internal review only
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Audit records are immutable
  }
);

module.exports = mongoose.model('ComplaintUpdate', complaintUpdateSchema);
