import ACCESS_TOKEN from "./apikey.js";

let onlyCakes = false;
let onlyCupcakes = false;
let currentSort = 0;

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
  sortProducts(products) {
    // 1 is recommended (which sorts by product ID)
    if (currentSort === 1) {
      products = products.sort((a, b) => a.productId > b.productId ? 1 : -1);
    // 2 is price, low to high
    } else if (currentSort === 2) {
      products = products.sort((a, b) => a.priceSmall > b.priceSmall ? 1 : -1);
    // 3 is price, high to low
    } else if (currentSort === 3) {
      products = products.sort((a, b) => a.priceSmall < b.priceSmall ? 1 : -1);
    // 4 is alphabetical a-z
    } else if (currentSort === 4) {
      products = products.sort((a, b) => a.title > b.title ? 1 : -1);
    // 5 is reverse alphabetical z-a
    } else if (currentSort === 5) {
      products = products.sort((a, b) => b.title > a.title ? 1 : -1);
    }
    // if currentSort is 0 it is on "Sort by", so the product order on the page should not change
    if (currentSort !== 0) {
      this.displayProducts(products);
    }
  }

  // products is an array of objects, one for each item
  displayProducts(products) {
    products = products.filter(product => {
      if (onlyCakes) {
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
        <div class="product-more-options-container">
          <h4 class="product-more-options">More information & size options</h4>
        </div>
        <img src="${product.productImage}" alt="">
      </div>
      <div class="product-information">
        <h3 class="product-title">${product.title}</h3>
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
    // productsContainer.insertAdjacentHTML('afterbegin', productHTML);
    this.getMoreInfoBtns();
  }

  getMoreInfoBtns() {
    const productMoreInfo = Array.from(document.querySelectorAll(".product"));
    productMoreInfo.forEach(product => {
      // click anywhere in the product box to visit the product page for that item
      product.addEventListener("click", () => {
      document.location.href = `product.html?id=${product.id}`;
      // https://vanillabeanbakery.netlify.app/product.html?id=XXXXX
      })
    })
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


// Category selection - cakes, cupcakes or everything
let categorySelectBtns = Array.from(document.querySelectorAll(".category-select"));
if (categorySelectBtns.length !== 0) {
  // show cakes and/or cupcakes based on whether onlyCupcakes and onlyCakes are true or false - if both are false, all categories will show, if either is true, only that category will be shown
  categorySelectBtns.forEach(btn => btn.addEventListener("click", e => {
    // the "selected" class highlights the selected category for the user - first remove "selected" from all buttons, then re-add it to the correct button
    categorySelectBtns.forEach(btn => btn.classList.remove("selected"));
    e.target.classList.add("selected");
    // reset onlyCakes and onlyCupcakes to false
    onlyCakes = false;
    onlyCupcakes = false;
    if (e.target.classList.contains("select-cake")) {
      onlyCakes = true;
    } else if (e.target.classList.contains("select-cupcake")) {
      onlyCupcakes = true;
    }

    products.getProducts()
    .then(data => display.displayProducts(data));
  }))
}

// Sorting options - by price low to high, recommended, etc
const sortingOptionsDOM = document.querySelector(".sorting-options") || "";
if (sortingOptionsDOM) {
  sortingOptionsDOM.addEventListener("change", () => {
    // currentSort is set to the index of the selected sorting option for use in the display.sortProducts method
    currentSort = sortingOptionsDOM.selectedIndex;
    products.getProducts()
    .then(data => display.sortProducts(data));
  })
}




// TODO
// index page buttons - shop cakes take to products.html with cakes selected, same for shop cupcakes
// have featured cakes and cupcakes shuffle based on day of the week?
// products.html sorting options (low-high) etc
// add 20% discount for chocolate cupcakes - require discount code?
// responsive styles for products page
// for cupcakes, can buy 1 or 6
// for cakes, size options 6inch, 8inch, 10inch, except 2 tier cakes, where it's 6+8, 8+10, 10+12 inch
// url: https://vanillabeanbakery.netlify.app/product.html?id=XXXXX