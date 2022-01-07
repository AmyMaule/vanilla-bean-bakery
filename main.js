import ACCESS_TOKEN from "./apikey.js";

let onlyCakes = false;
let onlyCupcakes = false;

var client = contentful.createClient({
    // This is the space ID
    space: "b7l7de9fk9yy",
    // This is the access token for this space
    accessToken: ACCESS_TOKEN
});


let basket = [];

class Products {
  async getProducts() {
    try {
      // This API call will request an entry with the specified ID from the space defined at the top, using a space-specific access token.
      let products;
      await client.getEntries({
        content_type: "product"
      })
      .then(data => products = data.items)
      .catch(err => console.log(err));

      let productInformation = products.map(product => {
        const { title, priceSmall, priceMed, priceLarge, productType } = product.fields;
        const productId = product.sys.id;
        const productImage = product.fields.productImage.fields.file.url;
        return {title, priceSmall, priceMed, priceLarge, productId, productImage, productType};
      })

      return productInformation;
    }
    catch(err) {
      console.log(err);
    }
  }
}

class Display {
  // products is an array of objects, one for each item
  displayProducts(products) {
    products = products.filter(product => {
      if (onlyCakes) {
        // console.log(products.productType);
        return product.productType === "cake";
      } else if (onlyCupcakes) {
        return product.productType === "cupcake";
      } else return products;
    })

    let productHTML = "";

    products.forEach(product => {
      productHTML += `
      <div class="product" id="${product.productId}">
      <div class="product-image">
        <img src="${product.productImage}" alt="">
      </div>
      <div class="product-information">
        <a href="#">
          <h3 class="product-title">${product.title}</h3>
        </a>
        <div class="price-container">
          <h4 class="price-from">${product.productType === "cake" ? "from" : ""}</h4>
          <h4 class="price-amount">$${product.priceSmall}</h4>
        </div>
      </div>
    </div>`
    })

    // if the current page is not products.html, productsContainer will be undefined
    let productsContainer = document.querySelector(".products-container") || "";
    if (productsContainer) productsContainer.innerHTML = productHTML;
  }

  alterProductDisplay(type) {
    if (type.classList.contains("select-cake")) {
      console.log("cakes only");
      console.log();
    }
  }
}

class Storage {}

// create instance of DisplayProducts and Products once the page loads
// document.addEventListener("DOMContentLoaded", () => {
  const display = new Display();
  const products = new Products();

  // call getProducts from the Products class, then pass the product data to the displayProducts method from the Display class
  products.getProducts()
  .then(data => display.displayProducts(data));
// })


let categorySelectBtns = Array.from(document.querySelectorAll(".category-select"));

categorySelectBtns.forEach(btn => btn.addEventListener("click", e => {
  if (e.target.classList.contains("select-cake")) {
    onlyCupcakes = false;
    onlyCakes = true;
    categorySelectBtns.forEach(btn => btn.classList.remove("selected"));
    e.target.classList.add("selected");
  } else if (e.target.classList.contains("select-cupcake")) {
    onlyCupcakes = true;
    onlyCakes = false;
    categorySelectBtns.forEach(btn => btn.classList.remove("selected"));
    e.target.classList.add("selected");
  } else {
    onlyCupcakes = false;
    onlyCakes = false;
    categorySelectBtns.forEach(btn => btn.classList.remove("selected"));
    e.target.classList.add("selected");
  }

  products.getProducts()
  .then(data => display.displayProducts(data));
}))