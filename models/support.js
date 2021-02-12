const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const supportSchema = new Schema({
    subject: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
}, {timestamps: true});

module.exports = mongoose.model('Support', supportSchema);