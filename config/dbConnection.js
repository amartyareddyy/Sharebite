const mongoose = require("mongoose");

const connectDB = async() => {
	try
	{
		console.log('Attempting to connect to MongoDB...');
		console.log('Connection URI:', process.env.MONGODB_URI);
		
		const conn = await mongoose.connect(process.env.MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
		});

		console.log(`MongoDB Connected: ${conn.connection.host}`);
		console.log('Database name:', conn.connection.name);
		console.log('Connection state:', mongoose.connection.readyState);
	}
	catch(error)
	{
		console.error('MongoDB Connection Error:', error.message);
		console.error('Full error:', error);
		process.exit(1);
	}
}

module.exports = connectDB;