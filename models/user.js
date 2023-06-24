const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
    birth: { type: String },
    tel: { type: String },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }
})

const User = mongoose.model('User', userSchema);

module.exports = User;