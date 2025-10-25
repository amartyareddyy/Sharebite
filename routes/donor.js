const express = require("express");
const router = express.Router();
const middleware = require("../middleware/index.js");
const User = require("../models/user.js");
const Donation = require("../models/donation.js");


router.get("/donor/dashboard", middleware.ensureDonorLoggedIn, async (req,res) => {
	try {
		const donorId = req.user._id;
		console.log('Checking counts for donor:', donorId);
		
		const numPendingDonations = await Donation.countDocuments({ donor: donorId, status: "pending" });
		const numAcceptedDonations = await Donation.countDocuments({ donor: donorId, status: "accepted" });
		const numAssignedDonations = await Donation.countDocuments({ donor: donorId, status: "assigned" });
		const numCollectedDonations = await Donation.countDocuments({ 
			donor: donorId, 
			status: { $in: ["collected", "delivered"] }
		});

		console.log('Donation counts:', {
			pending: numPendingDonations,
			accepted: numAcceptedDonations,
			assigned: numAssignedDonations,
			collected: numCollectedDonations
		});

		res.render("donor/dashboard", {
			title: "Dashboard",
			numPendingDonations, 
			numAcceptedDonations, 
			numAssignedDonations, 
			numCollectedDonations
		});
	} catch(err) {
		console.error('Error in donor dashboard:', err);
		req.flash("error", "Some error occurred on the server.");
		res.redirect("back");
	}
});

router.get("/donor/donate", middleware.ensureDonorLoggedIn, (req,res) => {
	res.render("donor/donate", { title: "Donate" });
});

router.post("/donor/donate", middleware.ensureDonorLoggedIn, async (req,res) => {
	try
	{
		const donation = req.body.donation;
		
		// Validate quantity
		const quantity = parseInt(donation.quantity);
		if (isNaN(quantity) || quantity < 20) {
			req.flash("error", "Quantity must be at least 20 persons");
			return res.redirect("back");
		}
		
		donation.status = "pending";
		donation.donor = req.user._id;
		const newDonation = new Donation(donation);
		await newDonation.save();
		req.flash("success", "Donation request sent successfully");
		res.redirect("/donor/donations/pending");
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/donor/donations/pending", middleware.ensureDonorLoggedIn, async (req,res) => {
	try
	{
		const pendingDonations = await Donation.find({ donor: req.user._id, status: ["pending", "rejected", "accepted", "assigned"] }).populate("agent");
		res.render("donor/pendingDonations", { title: "Pending Donations", pendingDonations });
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/donor/donations/previous", middleware.ensureDonorLoggedIn, async (req,res) => {
	try
	{
		const previousDonations = await Donation.find({ 
			donor: req.user._id, 
			status: { $in: ["collected", "delivered"] }  // Show both collected and delivered donations
		}).populate("agent");
		
		res.render("donor/previousDonations", { 
			title: "Previous Donations", 
			previousDonations 
		});
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/donor/donation/deleteRejected/:donationId", async (req,res) => {
	try
	{
		const donationId = req.params.donationId;
		await Donation.findByIdAndDelete(donationId);
		res.redirect("/donor/donations/pending");
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/donor/profile", middleware.ensureDonorLoggedIn, async (req, res) => {
	try {
		console.log('Fetching donations for donor:', req.user._id);
		
		// Get all collected donations for this donor
		const deliveredDonations = await Donation.find({
			donor: req.user._id,
			status: "collected",
			collectionImage: { $exists: true, $ne: null }  // Only get donations that have images
		})
		.populate('agent')  // We need agent info
		.sort({ collectionTime: -1 });  // Sort by collection time

		console.log('Found donations:', deliveredDonations);

		res.render("donor/profile", { 
			currentUser: req.user,
			deliveredDonations 
		});
	} catch (err) {
		console.error('Error in donor profile:', err);
		req.flash("error", "Something went wrong");
		res.redirect("/donor/dashboard");
	}
});

router.put("/donor/profile", middleware.ensureDonorLoggedIn, async (req,res) => {
	try
	{
		const id = req.user._id;
		const updateObj = req.body.donor;	// updateObj: {firstName, lastName, gender, address, phone}
		await User.findByIdAndUpdate(id, updateObj);
		
		req.flash("success", "Profile updated successfully");
		res.redirect("/donor/profile");
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
	
});


module.exports = router;