const Stripe = require("stripe");
const dotenv = require("dotenv");

// Load config
dotenv.config({ path: "config/config.env" });

const testStripe = async () => {
    try {
        console.log("Testing Stripe connection...");
        
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error("STRIPE_SECRET_KEY is missing in config.env");
        }

        const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
        
        // Try to create a dummy payment intent to verify the key permissions
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 100, // $1.00
            currency: 'usd',
            payment_method_types: ['card'],
        });
        
        console.log("✅ Stripe Secret Key is VALID.");
        console.log("Connection successful. Test Payment Intent ID:", paymentIntent.id);
    } catch (error) {
        console.log("❌ Stripe Secret Key is INVALID or connection failed.");
        console.log("Error:", error.message);
    }
};

testStripe();
