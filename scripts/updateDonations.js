const mongoose = require('mongoose');
const Donation = require('../models/donation');
require('dotenv').config();

async function updateDonations() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update all existing donations to include the new fields
        const result = await Donation.updateMany(
            {}, // Match all documents
            {
                $set: {
                    deliveryConfirmationImage: null,
                    deliveryTime: null
                }
            }
        );

        console.log(`Updated ${result.modifiedCount} donations`);
        console.log('Migration completed successfully');

    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

// Run the migration
updateDonations(); 