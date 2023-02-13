const mongoose = require("mongoose");

const WeeklyRunCountSchema = new mongoose.Schema({
  weekending: {
    type: Date,
    required: true,
  },
  userCount: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("WeeklyRunCount", WeeklyRunCountSchema);
