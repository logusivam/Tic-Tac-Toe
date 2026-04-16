// Local Backend API Endpoint Mapping
const Ishttps = window.location.protocol === 'https';
export default BACKEND_URL = Ishttps ? 
    "https://tic-tac-toe-api-bqou.onrender.com" :
    "http://localhost:3000";


