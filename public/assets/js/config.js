// Local Backend API Endpoint Mapping
const Ishttps = window.location.protocol === 'https';
export const BACKEND_URL = Ishttps ? 
    "" :
    "http://localhost:5000";


