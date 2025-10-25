const express = require("express");
const router = express.Router();
const middleware = require("../middleware/index.js");
const User = require("../models/user.js");
const Donation = require("../models/donation.js");
const path = require("path");
const fs = require("fs");
const upload = require("../config/multer.js");
const { sendDonationStatusEmailToDonor, sendDonationStatusEmailToAgent } = require("../utils/emailService.js");

router.get("/agent/dashboard", middleware.ensureAgentLoggedIn, async (req,res) => {
	try {
		const agentId = req.user._id;
		console.log('Checking counts for agent:', agentId);

		const numAssignedDonations = await Donation.countDocuments({ agent: agentId, status: "assigned" });
		const numCollectedDonations = await Donation.countDocuments({ 
			agent: agentId, 
			status: { $in: ["collected", "delivered"] }
		});

		console.log('Donation counts:', {
			assigned: numAssignedDonations,
			collected: numCollectedDonations
		});

		res.render("agent/dashboard", {
			title: "Dashboard",
			numAssignedDonations, 
			numCollectedDonations
		});
	} catch(err) {
		console.error('Error in agent dashboard:', err);
		req.flash("error", "Some error occurred on the server.");
		res.redirect("back");
	}
});

router.get("/agent/collections/pending", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const pendingCollections = await Donation.find({ agent: req.user._id, status: "assigned" }).populate("donor");
		res.render("agent/pendingCollections", { title: "Pending Collections", pendingCollections });
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/agent/collections/previous", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const agentId = req.user._id;
		console.log('Fetching previous collections for agent:', agentId);
		
		const previousCollections = await Donation.find({ 
			agent: agentId,
			status: { $in: ["collected", "delivered"] }  // Show both collected and delivered donations
		}).populate("donor");
		
		console.log('Found previous collections:', previousCollections.length);
		
		res.render("agent/previousCollections", { 
			title: "Previous Collections", 
			previousCollections 
		});
	}
	catch(err)
	{
		console.error('Error fetching previous collections:', err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/agent/collection/view/:collectionId", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const collectionId = req.params.collectionId;
		const collection = await Donation.findById(collectionId).populate("donor");
		res.render("agent/collection", { title: "Collection details", collection });
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/agent/collection/collect/:collectionId", middleware.ensureAgentLoggedIn, async (req,res) => {
	try {
		const collectionId = req.params.collectionId;
		const donation = await Donation.findById(collectionId).populate("donor");
		
		// Update donation status
		donation.status = "collected";
		donation.collectionTime = Date.now();
		await donation.save();

		// Send email to donor
		await sendDonationStatusEmailToDonor(
			donation.donor.email,
			donation.donor.firstName,
			{
				foodType: donation.foodType,
				quantity: donation.quantity,
				status: donation.status,
				collectionTime: donation.collectionTime
			}
		);

		// Send email to agent
		await sendDonationStatusEmailToAgent(
			req.user.email,
			req.user.firstName,
			{
				donorName: `${donation.donor.firstName} ${donation.donor.lastName}`,
				foodType: donation.foodType,
				quantity: donation.quantity,
				status: donation.status,
				collectionTime: donation.collectionTime
			}
		);

		req.flash("success", "Donation collected successfully");
		res.redirect(`/agent/collection/view/${collectionId}`);
	} catch(err) {
		console.error('Error in collecting donation:', err);
		req.flash("error", "Some error occurred while collecting the donation.");
		res.redirect("back");
	}
});

router.get("/agent/collection/deliver/:collectionId", middleware.ensureAgentLoggedIn, async (req,res) => {
	try {
		const collectionId = req.params.collectionId;
		const donation = await Donation.findById(collectionId).populate("donor");
		
		// Update donation status
		donation.status = "delivered";
		donation.deliveryTime = Date.now();
		await donation.save();

		// Send email to donor
		await sendDonationStatusEmailToDonor(
			donation.donor.email,
			donation.donor.firstName,
			{
				foodType: donation.foodType,
				quantity: donation.quantity,
				status: donation.status,
				createdAt: donation.createdAt
			}
		);

		// Send email to agent
		await sendDonationStatusEmailToAgent(
			req.user.email,
			req.user.firstName,
			{
				donorName: `${donation.donor.firstName} ${donation.donor.lastName}`,
				foodType: donation.foodType,
				quantity: donation.quantity,
				status: donation.status,
				createdAt: donation.createdAt
			}
		);

		req.flash("success", "Donation delivered successfully");
		res.redirect(`/agent/collection/view/${collectionId}`);
	} catch(err) {
		console.error('Error in delivering donation:', err);
		req.flash("error", "Some error occurred while delivering the donation.");
		res.redirect("back");
	}
});

router.get("/agent/profile", middleware.ensureAgentLoggedIn, (req,res) => {
	res.render("agent/profile", { title: "My Profile" });
});

router.put("/agent/profile", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const id = req.user._id;
		const updateObj = req.body.agent;	// updateObj: {firstName, lastName, gender, address, phone}
		await User.findByIdAndUpdate(id, updateObj);
		
		req.flash("success", "Profile updated successfully");
		res.redirect("/agent/profile");
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
	
});

// Route to show delivery confirmation form
router.get("/donations/:id/confirm", middleware.ensureAgentLoggedIn, async (req, res) => {
	try {
		const donation = await Donation.findById(req.params.id)
			.populate("donor");
		
		if (!donation || donation.agent.toString() !== req.user._id.toString()) {
			req.flash("error", "Donation not found or unauthorized");
			return res.redirect("/agent/dashboard");
		}

		res.render("agent/confirmDelivery", { donation });
	} catch (err) {
		console.error(err);
		req.flash("error", "Something went wrong");
		res.redirect("/agent/dashboard");
	}
});

// Route to handle delivery confirmation
router.post("/donations/:id/confirm", middleware.ensureAgentLoggedIn, upload.single("deliveryImage"), async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);
        
        if (!donation || donation.agent.toString() !== req.user._id.toString()) {
            req.flash("error", "Donation not found or unauthorized");
            return res.redirect("/agent/dashboard");
        }

        if (!req.file) {
            req.flash("error", "Please upload a delivery confirmation image");
            return res.redirect(`/agent/donations/${req.params.id}/confirm`);
        }

        // Log the file details for debugging
        console.log('File details:', {
            originalname: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            destination: req.file.destination
        });

        // Ensure the directory exists
        const uploadDir = 'public/uploads/delivery-images';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Update the donation with the new image path
        donation.deliveryConfirmationImage = `/uploads/delivery-images/${req.file.filename}`;
        donation.deliveryTime = new Date();
        donation.status = "delivered";
        
        // Save and log the donation update
        await donation.save();
        console.log('Donation updated:', {
            id: donation._id,
            imagePath: donation.deliveryConfirmationImage,
            status: donation.status
        });

        req.flash("success", "Delivery confirmed successfully");
        res.redirect("/agent/dashboard");
    } catch (err) {
        console.error('Error in delivery confirmation:', err);
        req.flash("error", "Something went wrong while saving the delivery confirmation");
        res.redirect("/agent/dashboard");
    }
});

// Route to show upload form for collection image
router.get("/agent/donation/:donationId/upload", middleware.ensureAgentLoggedIn, async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.donationId);
        
        if (!donation) {
            req.flash("error", "Donation not found");
            return res.redirect("/agent/collections/previous");
        }

        if (donation.agent.toString() !== req.user._id.toString()) {
            req.flash("error", "You are not authorized to upload images for this donation");
            return res.redirect("/agent/collections/previous");
        }

        res.render("agent/uploadCollectionImage", { 
            title: "Upload Collection Image",
            donation 
        });
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong");
        res.redirect("/agent/collections/previous");
    }
});

// Route to handle collection image upload
router.post("/agent/donation/:donationId/upload-image", middleware.ensureAgentLoggedIn, upload.single('collectionImage'), async (req, res) => {
    try {
        const donationId = req.params.donationId;
        const donation = await Donation.findById(donationId);

        if (!donation) {
            req.flash("error", "Donation not found");
            return res.redirect("back");
        }

        if (donation.agent.toString() !== req.user._id.toString()) {
            req.flash("error", "You are not authorized to upload images for this donation");
            return res.redirect("back");
        }

        if (!req.file) {
            req.flash("error", "Please select an image to upload");
            return res.redirect("back");
        }

        // Ensure upload directories exist
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'collections');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // If there's an existing image, delete it
        if (donation.collectionImage) {
            const oldImagePath = path.join(__dirname, '..', 'public', donation.collectionImage);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        // Update donation with new image path but keep status as collected
        donation.collectionImage = '/uploads/collections/' + req.file.filename;
        donation.status = "collected"; // Ensure status stays as collected
        await donation.save();

        console.log('Updated donation:', {
            id: donation._id,
            status: donation.status,
            collectionImage: donation.collectionImage
        });

        req.flash("success", "Collection image uploaded successfully");
        res.redirect("/agent/collections/previous");
    } catch (err) {
        console.error('Error in upload:', err);
        req.flash("error", "Error uploading image");
        res.redirect("back");
    }
});

module.exports = router;