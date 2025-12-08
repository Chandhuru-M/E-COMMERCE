// utils/mapFakeStoreToProduct.js

// Note: adapt the category mapping as per your needs
const CATEGORY_MAP = {
  "men's clothing": "Clothes/Shoes",
  "women's clothing": "Clothes/Shoes",
  "jewelery": "Accessories",
  "electronics": "Electronics",
  // fallback default is 'Clothes/Shoes' if not matched
};

function mapFakeToProductDoc(fake) {
  const rawCat = (fake.category || "").toLowerCase();
  const mappedCategory = CATEGORY_MAP[rawCat] || "Clothes/Shoes";

  // Ensure images array matches schema: images: [{ image: String }]
  const images = [];
  if (fake.image) images.push({ image: fake.image });

  // Ensure required fields exist per your schema
  return {
    name: fake.title || "Unknown Product",
    price: typeof fake.price === "number" ? fake.price : 0,
    description: fake.description || "No description available",
    ratings: fake.rating ? String(fake.rating.rate || "0") : "0",
    images,
    category: mappedCategory,
    seller: "FakeStore",
    stock: 20, // default stock for imported items (adjust if desired)
    numOfReviews: fake.rating ? (fake.rating.count || 0) : 0,
    reviews: []
  };
}

module.exports = mapFakeToProductDoc;
