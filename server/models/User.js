const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * User Model
 * 
 * Role-Based Access Control:
 * - 'citizen': Can register, submit complaints, view their own complaints, track progress.
 * - 'officer': Assigned to a department; can view assigned complaints, update progress notes.
 * - 'admin': Full system administrator; manages helplines, departments, reassigns complaints, views analytics.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    mobile: {
      type: String,
      required: [true, 'Please provide mobile number'],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian mobile number'],
    },
    email: {
      type: String,
      required: [true, 'Please provide email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Prevents accidental exposure in queries
    },
    role: {
      type: String,
      enum: {
        values: ['citizen', 'officer', 'admin'],
        message: '{VALUE} is not a valid user role',
      },
      default: 'citizen',
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    district: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Mongoose Pre-Save Hook: Hash plaintext password using bcrypt before writing to MongoDB
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance Method: Compare candidate password with stored bcrypt hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance Method: Generate signed JSON Web Token (JWT)
userSchema.methods.generateAuthToken = function () {
  const secret = process.env.JWT_SECRET || 'dev_secret_prototype_key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: this._id,
      name: this.name,
      email: this.email,
      role: this.role,
      departmentId: this.departmentId,
    },
    secret,
    { expiresIn }
  );
};

module.exports = mongoose.model('User', userSchema);
