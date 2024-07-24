const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    email: { type: String, required: true }, // Recipient email
    senderEmail: { type: String, required: true }, // Sender email
    documentPath: { type: String, required: true },
    originalName: { type: String, required: true },
    signed: { type: Boolean, default: false },
    signedDocumentPath: String, // Path to the signed document if needed
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);
