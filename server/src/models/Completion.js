const mongoose = require('mongoose');

const completionSchema = new mongoose.Schema(
  {
    habit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      required: [true, 'Completion must reference a habit'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Completion must reference a user'],
      index: true,
    },
    date: {
      type: String,
      required: [true, 'Completion date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound UNIQUE index on (habit, date) so a habit cannot be completed twice on the same day
completionSchema.index({ habit: 1, date: 1 }, { unique: true });

// Compound index on (user, date) for efficient heatmap and weekly query aggregations
completionSchema.index({ user: 1, date: 1 });

// Additional index for user habit date range queries
completionSchema.index({ habit: 1, user: 1, date: -1 });

completionSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Completion = mongoose.model('Completion', completionSchema);

module.exports = Completion;
