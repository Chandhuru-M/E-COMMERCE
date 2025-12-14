const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'config/config.env') });

const connectDatabase = () => {
    mongoose.connect(process.env.DB_LOCAL_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(con => {
        console.log(`MongoDB Database connected with HOST: ${con.connection.host}`);
    })
};

const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    description: String,
    ratings: String,
    images: [{ image: String }],
    category: String,
    seller: String,
    stock: Number,
    numOfReviews: Number,
    reviews: [],
    createdAt: Date
});

const Product = mongoose.model('Product', productSchema);

const checkProduct = async () => {
    await connectDatabase();
    
    const id = '690e20a2add66ce1bfa78bd6';
    console.log(`Checking product with ID: ${id}`);
    
    try {
        const product = await Product.findById(id);
        console.log('Product found:', product);
        if (product) {
            console.log('Product _id:', product._id);
        }
    } catch (err) {
        console.error('Error finding product:', err);
    }
    
    process.exit();
};

checkProduct();
