const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema); 