const mongoose = require('mongoose');

const materialSchema = mongoose.Schema({

    materialType: {
        type: String,
        required: [true, "Please enter a valid material type"]
    },
    batches: [{
        type: String,
        required:  [true, "Please choose valid batch(es)"]
    }],
    url: {
        type: String,
        required: [true, "Please enter a valid url"],
        unique: true
    },
    title: {
        type: String,
        required: [true, "Please enter a valid title"],
    },
    description: {
        type: String,
        required: [true, "Please enter a valid description"],
    },
    createdBy: {
        type: String,
        required: false
    },
    isActive: {
        type: Boolean,
        required: false,
        default: true
    }
}, {
    timestamps: true
});

const Material = mongoose.model('Material', materialSchema);
module.exports = Material;