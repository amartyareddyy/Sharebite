const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	firstName: {
		type: String,
		required: true
	},
	lastName: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	gender: {
		type: String,
		enum: ["male", "female"]
	},
	address: String,
	phone: {
		type: String,
		validate: {
			validator: function(v) {
				return /^\d{10}$/.test(v);
			},
			message: props => `${props.value} is not a valid 10-digit phone number!`
		}
	},
	drivingLicense: {
		type: String,
		validate: {
			validator: function(v) {
				// Only validate if role is agent
				if (this.role !== 'agent') return true;
				// Driving license should be alphanumeric and between 8-15 characters
				return /^[A-Za-z0-9]{8,15}$/.test(v);
			},
			message: props => `${props.value} is not a valid driving license number! It should be 8-15 alphanumeric characters.`
		}
	},
	joinedTime: {
		type: Date,
		default: Date.now
	},
	role: {
		type: String,
		enum: ["admin", "donor", "agent"],
		required: true
	}
});

const User = mongoose.model("users", userSchema);
module.exports = User;