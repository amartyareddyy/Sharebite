const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Donation = require('../models/donation');
require('dotenv').config();

async function fixImagePaths() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get all donations with delivery confirmation images
        const donations = await Donation.find({
            deliveryConfirmationImage: { $exists: true, $ne: null }
        });

        console.log(`Found ${donations.length} donations with images`);

        for (const donation of donations) {
            if (!donation.deliveryConfirmationImage) continue;

            // Get the old path and create new path
            const oldPath = donation.deliveryConfirmationImage.replace('/uploads/', 'public/uploads/');
            const fileName = path.basename(donation.deliveryConfirmationImage);
            const newRelativePath = `/uploads/delivery-images/${fileName}`;
            const newFullPath = `public/uploads/delivery-images/${fileName}`;

            // Create delivery-images directory if it doesn't exist
            if (!fs.existsSync('public/uploads/delivery-images')) {
                fs.mkdirSync('public/uploads/delivery-images', { recursive: true });
            }

            // Move the file if it exists
            try {
                if (fs.existsSync(oldPath)) {
                    fs.renameSync(oldPath, newFullPath);
                    console.log(`Moved file from ${oldPath} to ${newFullPath}`);
                } else {
                    console.log(`File not found: ${oldPath}`);
                }
            } catch (err) {
                console.error(`Error moving file: ${err.message}`);
            }

            // Update the database record
            donation.deliveryConfirmationImage = newRelativePath;
            await donation.save();
            console.log(`Updated database record for donation ${donation._id}`);
        }

        console.log('Migration completed successfully');

    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

fixImagePaths(); 