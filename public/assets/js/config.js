// Local Backend API Endpoint Mapping
const isHttps = window.location.protocol === 'https:';
const BACKEND_URL = isHttps ? 
    "https://tic-tac-toe-api-bqou.onrender.com" :
    "http://localhost:3000";

export default BACKEND_URL;

