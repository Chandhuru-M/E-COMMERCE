const axios = require('axios');

async function checkDummyJson() {
    try {
        const { data } = await axios.get('https://dummyjson.com/products/search?q=watch');
        console.log("Total products:", data.total);
        console.log("Watches found:", data.products.map(p => p.title));
    } catch (e) {
        console.error(e);
    }
}

checkDummyJson();