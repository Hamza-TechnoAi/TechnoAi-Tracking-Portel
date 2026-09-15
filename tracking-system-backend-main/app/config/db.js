const mongoose = require('mongoose');

const dropObsoleteUserIndexes = async () => {
    try {
        const usersCollection = mongoose.connection.collection('users');
        await usersCollection.dropIndex('userId_1');
        console.log('Dropped obsolete userId_1 index');
    } catch (err) {
        if (err.code !== 27 && err.codeName !== 'IndexNotFound') {
            console.warn('Could not drop userId_1 index:', err.message);
        }
    }
};

const configureDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CLOUD_URI);
        console.log("✅ MongoDB Connected...");
        await dropObsoleteUserIndexes();
    } catch (err) {
        console.error("❌ Error Connecting to MongoDB:", err.message);
        process.exit(1); // Stop server on failure
    }
};

module.exports = configureDB;