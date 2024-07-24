import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => {
    return (
        <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', background: 'transparent', textAlign: 'center', color: 'white' }}>
            <Typography variant="body1" sx={{color:'white'}}>
                &copy; {new Date().getFullYear()} eSignify. All rights reserved.
            </Typography>
        </Box>
    );
};

export default Footer;
