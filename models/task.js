const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    name: { type: String },
    description: { type: String },
    toDo: { type: Boolean },
    isInProgress: { type: Boolean },
    isFinished: { type: Boolean },
    date: { type: Date, default: Date.now },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
    createdBy: {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    }
})

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;