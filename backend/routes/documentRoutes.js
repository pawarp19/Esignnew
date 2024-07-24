const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const docusign = require('docusign-esign');
const jwt = require('jsonwebtoken');
const Document = require('../models/Document');

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

const DOCUSIGN_API_BASE_URL = process.env.DOCUSIGN_API_BASE_URL || 'https://demo.docusign.net/restapi';
const DOCUSIGN_INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY;
const DOCUSIGN_ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID;
const DOCUSIGN_USER_ID = process.env.DOCUSIGN_USER_ID;
const PRIVATE_KEY = fs.readFileSync('./private.key', 'utf8');

router.post('/upload', upload.single('document'), async (req, res) => {
    try {
        const { email, senderEmail } = req.body; // Capture sender email
        const documentPath = req.file.path;
        const originalName = req.file.originalname;

        const document = new Document({ email, senderEmail, documentPath, originalName });
        await document.save();

        res.json({ document });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error uploading document' });
    }
});



const createJWTToken = () => {
    const payload = {
        iss: DOCUSIGN_INTEGRATION_KEY,
        sub: DOCUSIGN_USER_ID,
        aud: 'account-d.docusign.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        scope: 'signature impersonation'
    };

    return jwt.sign(payload, PRIVATE_KEY, { algorithm: 'RS256' });
};

const getAccessToken = async () => {
    const jwtToken = createJWTToken();

    try {
        const response = await axios.post('https://account-d.docusign.com/oauth/token', new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwtToken
        }).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data.access_token;
    } catch (error) {
        console.error('Error fetching access token:', error.response ? error.response.data : error.message);
        throw new Error('Error fetching access token: ' + (error.response ? error.response.data : error.message));
    }
};

router.post('/send', async (req, res) => {
    try {
        const { documents } = req.body;
        const accessToken = await getAccessToken();
        const apiClient = new docusign.ApiClient();
        apiClient.setBasePath(DOCUSIGN_API_BASE_URL);
        apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);
        const envelopesApi = new docusign.EnvelopesApi(apiClient);

        for (const doc of documents) {
            const document = await Document.findById(doc._id);
            if (!document) continue;

            const envelopeDefinition = {
                emailSubject: 'Please sign this document',
                documents: [
                    {
                        documentBase64: fs.readFileSync(document.documentPath).toString('base64'),
                        name: document.originalName,
                        fileExtension: 'pdf',
                        documentId: '1'
                    }
                ],
                recipients: {
                    signers: [
                        {
                            email: document.email,
                            name: document.email.split('@')[0] || 'Signer',
                            recipientId: '1',
                            routingOrder: '1'
                        }
                    ]
                },
                status: 'sent' // This will cause DocuSign to send the email
            };

            try {
                const envelopeSummary = await envelopesApi.createEnvelope(DOCUSIGN_ACCOUNT_ID, { envelopeDefinition });
                console.log('Envelope created:', envelopeSummary);
            } catch (error) {
                console.error('Error creating envelope:', error.response ? error.response.data : error.message);
            }
        }

        res.json({ message: 'Emails sent successfully!' });
    } catch (error) {
        console.error('Error sending documents for signing:', error);
        res.status(500).json({ message: 'Error sending documents for signing' });
    }
});

router.post('/docusign/callback', async (req, res) => {
    try {
        const envelopeStatus = req.body;
        const envelopeId = envelopeStatus.envelopeId;
        const status = envelopeStatus.status;

        if (status === 'completed') {
            const document = await Document.findOne({ 'envelopes.id': envelopeId });

            if (document) {
                const accessToken = await getAccessToken();
                
                // Function to download signed document
                const downloadSignedDocument = async (envelopeId, documentId, accessToken) => {
                    const apiClient = new docusign.ApiClient();
                    apiClient.setBasePath(DOCUSIGN_API_BASE_URL);
                    apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

                    const envelopesApi = new docusign.EnvelopesApi(apiClient);
                    const result = await envelopesApi.getDocument(DOCUSIGN_ACCOUNT_ID, envelopeId, documentId);
                    
                    return result; // Returns the document data
                };

                // Retrieve signed document
                const signedDocument = await downloadSignedDocument(envelopeId, '1', accessToken);

                // Function to send the signed document via email
                const sendSignedDocument = async (toEmail, documentUrl) => {
                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: toEmail,
                        subject: 'Document Signed',
                        text: `The document has been signed. You can download it from: ${documentUrl}`
                    });
                };

                // Notify the sender and signer
                await sendSignedDocument(document.senderEmail, signedDocument.url); // Notify the sender
                await sendSignedDocument(document.email, signedDocument.url); // Notify the recipient
            }
        }

        res.status(200).send('Notification received');
    } catch (error) {
        console.error('Error handling DocuSign notification:', error);
        res.status(500).send('Error handling notification');
    }
});



module.exports = router;
