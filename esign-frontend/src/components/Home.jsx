import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SendIcon from '@mui/icons-material/Send';
import CircularProgress from '@mui/material/CircularProgress'; // For loading spinner
import Button from '@mui/material/Button';
import '../App.css';

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function App() {
    const [file, setFile] = useState(null);
    const [email, setEmail] = useState('');
    const [senderEmail, setSenderEmail] = useState('');
    const [editSenderEmail, setEditSenderEmail] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [loading, setLoading] = useState(false); // Loading state

    useEffect(() => {
        // Load sender email from session storage when component mounts
        const savedSenderEmail = sessionStorage.getItem('senderEmail');
        if (savedSenderEmail) {
            setSenderEmail(savedSenderEmail);
        }
    }, []);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handleSenderEmailChange = (e) => {
        setSenderEmail(e.target.value);
    };

    const handleSaveSenderEmail = () => {
        sessionStorage.setItem('senderEmail', senderEmail);
        setEditSenderEmail(false);
        setSnackbarMessage('Sender email saved successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !email || !senderEmail) {
            setSnackbarMessage('Please upload a file, enter the recipient email, and sender email.');
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            return;
        }

        const formData = new FormData();
        formData.append('document', file);
        formData.append('email', email);
        formData.append('senderEmail', senderEmail);

        try {
            const response = await axios.post('https://esign-backend-x620.onrender.com/api/documents/upload', formData);
            setDocuments([...documents, response.data.document]);
            setFile(null);
            setEmail('');
            setSnackbarMessage('Document uploaded successfully!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (error) {
            setSnackbarMessage('Error uploading document.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleSend = async () => {
        if (documents.length === 0) {
            setSnackbarMessage('No documents to send.');
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            return;
        }

        setLoading(true); // Start loading
        try {
            const response = await axios.post('https://esign-backend-x620.onrender.com/api/documents/send', { documents });
            setSnackbarMessage(response.data.message);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);

            // Reset the form fields after successful email send
            setDocuments([]);
            setEmail('');
            setFile(null);
        } catch (error) {
            setSnackbarMessage('Error sending documents for signing.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setLoading(false); // Stop loading
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    return (
        <div className="App">
            <h1>Upload Documents</h1>
            <form onSubmit={handleUpload}>
                <input
                    type="file"
                    onChange={handleFileChange}
                    required
                />
                <input
                    type="email"
                    placeholder="Recipient email"
                    value={email}
                    onChange={handleEmailChange}
                    required
                />
                <div style={{marginBottom:'20px'}}>
                    {editSenderEmail ? (
                        <>
                            <input
                                type="email"
                                placeholder="Sender email"
                                value={senderEmail}
                                onChange={handleSenderEmailChange}
                                required
                            />
                            <Button 
                                variant="contained" 
                                color="primary" 
                                onClick={handleSaveSenderEmail}
                                style={{marginRight:'15px'}}
                            >
                                Save
                            </Button>
                            <Button 
                                variant="contained" 
                                onClick={() => setEditSenderEmail(false)}
                                sx={{color:'white',backgroundColor:'grey'}}
                            >
                                Cancel
                            </Button>
                        </>
                    ) : (
                        <>
                            <span style={{marginRight:'15px'}}>Sender email: {senderEmail}</span>
                            <Button 
                                variant="contained" 
                                color="primary" 
                                onClick={() => setEditSenderEmail(true)}
                            >
                                Edit
                            </Button>
                        </>
                    )}
                </div>
                <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary" 
                    startIcon={<UploadFileIcon />}
                >
                    Upload
                </Button>
            </form>
            <h2>Uploaded Documents</h2>
            <ul>
                {documents.map((doc, index) => (
                    <li key={index}>
                        <span>{doc.originalName}</span>
                        <input
                            type="email"
                            placeholder="Recipient email"
                            value={doc.email}
                            readOnly
                        />
                    </li>
                ))}
            </ul>
            <Button 
                onClick={handleSend} 
                variant="contained" 
                color="primary" 
                startIcon={<SendIcon />}
                disabled={loading} // Disable button when loading
            >
                {loading ? <CircularProgress size={24} /> : 'Send Emails'} 
            </Button>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={2000}
                onClose={handleCloseSnackbar}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </div>
    );
}

export default App;
