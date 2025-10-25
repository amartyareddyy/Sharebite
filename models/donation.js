const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
	donor: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "users",
		required: true
	},
	agent: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "users",
	},
	foodType: {
		type: String,
		required: true
	},
	quantity: {
		type: String,
		required: true
	},
	cookingTime: {
		type: Date,
		required: true
	},
	address: {
		type: String,
		required: true
	},
	phone: {
		type: String,
		required: true,
		validate: {
			validator: function(v) {
				return /^\d{10}$/.test(v);
			},
			message: props => `${props.value} is not a valid 10-digit phone number!`
		}
	},
	donorToAdminMsg: String,
	adminToAgentMsg: String,
	collectionTime: {
		type: Date,
	},
	status: {
		type: String,
		enum: ["pending", "rejected", "accepted", "assigned", "collected", "delivered"],
		required: true
	},
	collectionImage: {
		type: String,
		default: null
	},
	deliveryConfirmationImage: {
		type: String,
		default: null
	},
	deliveryTime: {
		type: Date,
		default: null
	}
});

const Donation = mongoose.model("donations", donationSchema);
module.exports = Donation;