const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Function to send donation status email to donor
const sendDonationStatusEmailToDonor = async (donorEmail, donorName, donationDetails) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: donorEmail,
            subject: `Your Donation Status Update - ShareBite`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #3f51b5;">ShareBite Donation Update</h2>
                    <p>Dear ${donorName},</p>
                    <p>Your donation has been ${donationDetails.status.toLowerCase()}.</p>
                    <p><strong>Donation Details:</strong></p>
                    <ul>
                        <li>Food Type: ${donationDetails.foodType}</li>
                        <li>Quantity: ${donationDetails.quantity}</li>
                        <li>Status: ${donationDetails.status}</li>
                        <li>Collection time: ${new Date(donationDetails.collectionTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short"})}</li>
                    </ul>
                    <p>Thank you for your contribution to reducing food waste and helping those in need!</p>
                    <p>Best regards,<br>ShareBite Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Donation status email sent to donor successfully');
    } catch (error) {
        console.error('Error sending donation status email to donor:', error);
        throw error;
    }
};

// Function to send donation status email to agent
const sendDonationStatusEmailToAgent = async (agentEmail, agentName, donationDetails) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: agentEmail,
            subject: `Donation Status Update - ShareBite`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #3f51b5;">ShareBite Donation Update</h2>
                    <p>Dear ${agentName},</p>
                    <p>A donation has been ${donationDetails.status.toLowerCase()}.</p>
                    <p><strong>Donation Details:</strong></p>
                    <ul>
                        <li>Donor: ${donationDetails.donorName}</li>
                        <li>Food Type: ${donationDetails.foodType}</li>
                        <li>Quantity: ${donationDetails.quantity}</li>
                        <li>Status: ${donationDetails.status}</li>
                        <li>Collection time: ${new Date(donationDetails.collectionTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short"})}</li>
                    </ul>
                    <p>Please take necessary action as per the donation status.</p>
                    <p>Best regards,<br>ShareBite Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Donation status email sent to agent successfully');
    } catch (error) {
        console.error('Error sending donation status email to agent:', error);
        throw error;
    }
};

module.exports = {
    sendDonationStatusEmailToDonor,
    sendDonationStatusEmailToAgent
}; 