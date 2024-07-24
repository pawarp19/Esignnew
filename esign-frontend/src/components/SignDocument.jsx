import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';

const SignDocument = () => {
    const { id } = useParams();

    useEffect(() => {
        // Redirect to the signing URL
        window.location.href = `http://localhost:5000/api/documents/esign/${id}`;
    }, [id]);

    return (
        <div>
            <p>Redirecting to signing interface...</p>
        </div>
    );
};

export default SignDocument;
