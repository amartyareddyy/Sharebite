const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
	res.render("home/welcome", { title: "ShareBite" });
});

router.get("/about-us", (req, res) => {
	res.render("home/aboutUs", { title: "About Us | ShareBite" });
});

router.get("/contact-us", (req, res) => {
	res.render("home/contactUs", { title: "Contact us | ShareBite" });
});

router.post("/contact-us", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // Basic validation
        if (!name || !email || !subject || !message) {
            req.flash("error", "Please fill in all fields");
            return res.redirect("/contact-us");
        }

        // Here you can add code to save the contact form data to a database if needed
        
        // Set success message and redirect
        req.flash("success", "Your message has been sent successfully!");
        res.render("home/contactSuccess", { title: "Message Sent | ShareBite" });
    } catch (err) {
        console.error('Error in contact form submission:', err);
        req.flash("error", "Some error occurred while sending your message.");
        return res.redirect("/contact-us");
    }
});

module.exports = router;