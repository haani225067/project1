const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Habit must belong to a user'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Habit name is required'],
      trim: true,
      minlength: [2, 'Habit name must be between 2 and 60 characters'],
      maxlength: [60, 'Habit name cannot exceed 60 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },
    color: {
      type: String,
      trim: true,
      default: '#6366f1',
      match: [/^#([0-9a-fA-F]{3}){1,2}$/, 'Please provide a valid hex color code'],
    },
    icon: {
      type: String,
      trim: true,
      default: '⭐',
      maxlength: [10, 'Icon identifier cannot exceed 10 characters'],
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user habit listings
habitSchema.index({ user: 1, isArchived: 1, createdAt: -1 });

habitSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Habit = mongoose.model('Habit', habitSchema);

module.exports = Habit;
