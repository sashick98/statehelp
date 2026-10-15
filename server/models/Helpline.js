const mongoose = require('mongoose');

/**
 * Helpline Model
 * Stores state and emergency helpline numbers.
 * Includes data verification timestamps and sample data disclosures.
 */
const helplineSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide helpline title in English'],
      trim: true,
    },
    titleTamil: {
      type: String,
      required: [true, 'Please provide helpline title in Tamil'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please provide category'],
      enum: [
        'Emergency',
        'Police & Safety',
        'Healthcare & Medical',
        'Women & Child Safety',
        'Disaster & Rescue',
        'Electricity & Utilities',
        'Transport & Highway',
        'Senior Citizens & Social Welfare',
        'Citizen Services',
      ],
      default: 'Emergency',
    },
    phoneNumber: {
      type: String,
      required: [true, 'Please provide phone number or short code'],
      trim: true,
    },
    alternateNumber: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    descriptionTamil: {
      type: String,
      trim: true,
      default: '',
    },
    operatingHours: {
      type: String,
      default: '24x7 Toll-Free',
    },
    officialSourceUrl: {
      type: String,
      trim: true,
      default: 'https://www.tn.gov.in',
    },
    lastVerifiedAt: {
      type: Date,
      default: Date.now,
    },
    isSampleData: {
      type: Boolean,
      default: true, // Prototype safety notice
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound search index for fast public lookup
helplineSchema.index({ title: 'text', description: 'text', phoneNumber: 'text' });

module.exports = mongoose.model('Helpline', helplineSchema);
