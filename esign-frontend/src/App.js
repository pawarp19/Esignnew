import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/Home'; // Create this page
import SignDocument from './components/SignDocument';
import { Container, Box } from '@mui/material';

function App() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <Container component="main" sx={{ flex: 1, py: 4 }}>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/documents/esign/:id" component={SignDocument} />
                </Routes>
            </Container>
            <Footer />
        </Box>
    );
}

export default App;
