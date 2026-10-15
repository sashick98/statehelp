const mongoose = require('mongoose');

/**
 * Department Model
 * Represents public administration departments handling citizen grievances
 * (e.g., Police, Healthcare, Fire & Rescue, Electricity, Water Supply, Transport).
 */
const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide department name in English'],
      trim: true,
      unique: true,
    },
    nameTamil: {
      type: String,
      required: [true, 'Please provide department name in Tamil'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Please provide unique department code (e.g. POL, HLTH)'],
      unique: true,
      uppercase: true,
      trim: true,
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
    icon: {
      type: String,
      default: 'Building2', // Lucide icon identifier
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Department', departmentSchema);
