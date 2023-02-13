const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const userSchema = new mongoose.Schema({
  twitchUsername: { type: String, required: [true, 'Twitch username is required'], unique: true },
  runHistory: { type: [String], default: [] },
  secondRunCount: { type: Number, default: 0 },
}, {
  timestamps: true
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('TwitchUser', userSchema);
