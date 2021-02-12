const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isBanned: {
        type: Boolean,
        required: true
    },
    tokenVersion: {
        type: Number,
        required: true,
        default: 0
    },
    emailVerified: {
        type: Boolean,
        required: true,
        default: false
    },
    createdEncounters: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Encounter' // this is the model name we are relating it to. We are saying we are storing ids from the even type
        }
    ],
    createdComments: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ],
    likedEncounters: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Encounter'
        }
    ]
}, {timestamps: true});

module.exports = mongoose.model('User', userSchema);