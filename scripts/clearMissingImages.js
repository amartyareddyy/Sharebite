const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Donation = require('../models/donation');
require('dotenv').config();

async function clearMissingImages() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get all donations with delivery confirmation images
        const donations = await Donation.find({
            deliveryConfirmationImage: { $exists: true, $ne: null }
        });

        console.log(`Found ${donations.length} donations with image paths`);

        for (const donation of donations) {
            if (!donation.deliveryConfirmationImage) continue;

            // Check if the image file exists
            const imagePath = path.join('public', donation.deliveryConfirmationImage);
            if (!fs.existsSync(imagePath)) {
                console.log(`Image not found: ${imagePath}`);
                donation.deliveryConfirmationImage = null;
                await donation.save();
                console.log(`Cleared image path for donation ${donation._id}`);
            }
        }

        console.log('Cleanup completed successfully');

    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

clearMissingImages(); 