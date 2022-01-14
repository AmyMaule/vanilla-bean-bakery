import ACCESS_TOKEN from "./apikey.js";

let onlyCakes = false;
let onlyCupcakes = false;
let currentSort = 0;

var client = contentful.createClient({
    // This is the space ID
    space: "b7l7de9fk9yy",
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
        const { title, priceSmall, priceMed, priceLarge, productType, flavor, icingFlavor, dripType, topping1, topping2, tiers } = product.fields;
        const productId = product.sys.id;
        const productImage = product.fields.productImage.fields.file.url;
        return {price: [priceSmall, priceMed, priceLarge], title, productId, productImage, productType, flavor, icingFlavor, dripType, topping1, topping2, tiers};
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
      products = products.sort((a, b) => a.price[0] > b.price[0] ? 1 : -1);
    // 3 is price, high to low
    } else if (currentSort === 3) {
      products = products.sort((a, b) => a.price[0] < b.price[0] ? 1 : -1);
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
          <h4 class="price-amount">$${product.price[0]}</h4>
        </div>
      </div>
    </div>`
    })

    // if the current page is not products.html, productsContainer will be undefined
    let productsContainer = document.querySelector(".products-container") || "";
    if (productsContainer) productsContainer.innerHTML = productHTML;
    // productsContainer.insertAdjacentHTML('afterbegin', productHTML);
    this.getSingleProduct(products);
  }

  // redirects to product.html?id=xxxx based on whichever product is clicked
  getSingleProduct(products) {
    const productMoreInfo = Array.from(document.querySelectorAll(".product"));
    productMoreInfo.forEach(product => {
      // click anywhere in the product box to visit the product page for that item
      product.addEventListener("click", () => {
        let currentProduct = products.find(prod => {
          return prod.productId === product.id;
        });
        this.displaySingleProduct(currentProduct, product);
      // https://vanillabeanbakery.netlify.app/product.html?id=XXXXX
      })
    })
  }

  displaySingleProduct(currentProduct, productDOM) {
    // document.location.href = `products.html?id=${product.id}`;

    // replaceState changes the URL without reloading the page (and thus without reloading the script)
    window.history.replaceState(null, "", `products.html?productId=${productDOM.id}`);

    // hide the current products, and show the selected product
    document.querySelector(".product-display-background").classList.add("hide");
    document.querySelector(".products").classList.add("hide");
    document.querySelector(".single-product").classList.remove("hide");

    // dynamically fill in the product details using the selected product data
    document.querySelector(".size-options-title").innerHTML = currentProduct.productType === "cake" ? "Select size :" : "Box size: ";
    document.querySelector(".single-product-image").src = currentProduct.productImage;
    document.querySelector(".single-product-title").innerHTML = currentProduct.title;
    const currentPriceDOM = document.querySelector(".single-product-price");
    currentPriceDOM.innerHTML = `$${currentProduct.price[0]}`;
    document.querySelector(".single-product-description").innerHTML = `The ${currentProduct.title} features 4 layers of ${currentProduct.flavor} sponge filled and decorated with ${currentProduct.icingFlavor}. Finished off with an optional ${currentProduct.dripType} drip, ${currentProduct.topping1}, and ${currentProduct.topping2}. Available in the following sizes: ${currentProduct.tiers === 1 ? "6-inch, 8-inch and 10-inch." : "6/8-inch, 8/10-inch and 10/12-inch tiers."}`;
    currentProduct.productType === "cupcake"
      ? document.querySelector(".portion-size-guide").classList.add("hide")
      : document.querySelector(".portion-size-guide").classList.remove("hide");

    // scrollTo doesn't work as expected unless the if condition is in place
    if (window.scrollY !== 0) {
      window.scrollTo(0, 0);
    }

    // change the price on the page based on the size selected
    let sizeSelect = document.querySelector(".size-select");
    sizeSelect.addEventListener("change", () => {
      currentPriceDOM.innerHTML = `$${currentProduct.price[sizeSelect.selectedIndex]}`;
    })

    let currentQuantity = 1;
    [...document.querySelectorAll(".qty-change")].forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("minus")) {
          if (currentQuantity > 1) {
            currentQuantity--;
          }
        } else {
          currentQuantity++;
        }
        document.querySelector(".product-qty").innerHTML = currentQuantity;
      });
    })

    let addToBasketBtn = document.querySelector(".add-to-basket");
    addToBasketBtn.addEventListener("click", () => {
      // console.log(currentQuantity, currentProduct.price[sizeSelect.selectedIndex]);

      addToBasketBtn.classList.add("added-to-basket");
      addToBasketBtn.innerHTML = "Added to basket";

      setTimeout(() => {
        addToBasketBtn.classList.remove("added-to-basket");
        addToBasketBtn.innerHTML = "Add to basket";
      }, 1500)
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
// add 20% discount for chocolate cupcakes - require discount code?
// responsive styles for products page
// for cupcakes, can buy 1 or 6
// url: https://vanillabeanbakery.netlify.app/product.html?id=XXXXX
// For description, write generic description and add key words to each one (4 layers of ${raspberry} sponge topped with a ${white chocolate} blah blah)
// responsive design for single product page
// check responsive styles for products.html