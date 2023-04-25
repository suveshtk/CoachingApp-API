const mongoose = require('mongoose');

const batchSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter a valid name"],
        unique: true
    },
    year: {
        type: Number,
        required: [true, "Please enter a valid year"],
    },
    isActive: {
        type: Boolean,
        required: false,
        default: true
    },
}, {
    timestamps: true
});

const Batch = mongoose.model('Batch', batchSchema);
module.exports = Batch;