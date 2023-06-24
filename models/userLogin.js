const mongoose = require('mongoose');

const userLoginSchema = new mongoose.Schema({
    company: { type: String },
    email: { type: String },
    password: { type: String },
})

const UserLogin = mongoose.model('usersLogin', userLoginSchema)

module.exports = UserLogin;