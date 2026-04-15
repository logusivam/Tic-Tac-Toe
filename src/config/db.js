const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri || uri === 'YOUR_ATLAS_URI_HERE') {
            console.warn('MongoDB URI is not set in .env. Skipping DB connection.');
            return;
        }
        await mongoose.connect(uri);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
