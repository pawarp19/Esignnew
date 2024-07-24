import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <AppBar position="static" sx={{ background: 'transparent', boxShadow: 'none' }}>
            <Toolbar>
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" component="div">
                        <img src="/logonew.png" alt="Company Logo" style={{ height: 80, marginRight: 10,width:120 }} />
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex' }}>
                    <Button color="inherit" component={Link} to="/">Home</Button>
                    <Button color="inherit">About</Button>
                    <Button color="inherit" >Contact</Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
