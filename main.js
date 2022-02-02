import ACCESS_TOKEN from "./apikey.js";

let onlyCakes = false;
let onlyCupcakes = false;
let currentSort = 0;
const numBasketItemsDOM = document.querySelector(".num-basket-items");

const client = contentful.createClient({
    // This is the space ID and access token for the contentful data
    space: "b7l7de9fk9yy",
    accessToken: ACCESS_TOKEN
});

// basket is initialised to empty array, and overwritten if local storage already contains basket items
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

      const productInformation = products.map(product => {
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

    this.getSingleProduct(products);
  }

  // redirects to product.html?productId=xxxx
  getSingleProduct(products) {
    const productMoreInfo = Array.from(document.querySelectorAll(".product"));
    productMoreInfo.forEach(product => {
      // click anywhere in the product box to visit the product page for that item
      product.addEventListener("click", () => {
        const currentProduct = products.find(prod => {
          return prod.productId === product.id;
        });
        this.displaySingleProduct(currentProduct, product);
      })
    })
  }

  displaySingleProduct(currentProduct, productDOM) {
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
    const sizeSelect = document.querySelector(".size-select");
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

    // add a product to the basket
    const addToBasketBtn = document.querySelector(".add-to-basket");
    addToBasketBtn.addEventListener("click", () => {
      // check if the item is already in the basket
      const inBasket = basket.find(item => item.id === currentProduct.productId);
      if (inBasket) {
        // if it is, increase the current size selected (small is 0, med is 1, large is 2) by the chosen quantity
        inBasket.quantity[sizeSelect.selectedIndex] += currentQuantity;
      } else {
        console.log(currentProduct);
        // otherwise add a blank item to the basket, and then increase the current size selected by the chosen quantity
        basket.push({
          id: currentProduct.productId,
          title: currentProduct.title,
          quantity: [0, 0, 0],
          productType: currentProduct.productType,
          productImage: currentProduct.productImage,
          price: currentProduct.price
        })
        basket[basket.length-1].quantity[sizeSelect.selectedIndex] += currentQuantity;
      }

      Storage.saveBasket(basket);
      // const itemInbasket = Storage.getItem(currentProduct.productId)
      // console.log(itemInbasket);
      numBasketItemsDOM.innerHTML = CalculateItems.calculateItems(basket) || "0";

      console.log(...basket);
      // console.log(currentQuantity, currentProduct.price[sizeSelect.selectedIndex]);

      addToBasketBtn.classList.add("added-to-basket");
      addToBasketBtn.innerHTML = "Added to basket";

      setTimeout(() => {
        addToBasketBtn.classList.remove("added-to-basket");
        addToBasketBtn.innerHTML = "Add to basket";
      }, 1500)
    });
  }
}

class CalculateItems {
  static calculateItems(basket) {
    // from the basket, add each quantity array as single digits, then reduce them to find the total number of items in the basket
    let numItems = [];
    if (basket.length !== 0) {
      basket.forEach(item => numItems.push(...item.quantity))
      return numItems.reduce((total, acc) => total + acc);
    }
  }
}

class Storage {
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }

  static getItem(id) {
    const products = JSON.parse(localStorage.getItem("products"));
    return products.find(product => product.productId === id);
  }

  static saveBasket(basket) {
    localStorage.setItem("basket", JSON.stringify(basket));
  }

  static getBasket() {
    // return the basket if it exists in local storage, otherwise return an empty array
    if (localStorage.getItem("basket")) {
      return JSON.parse(localStorage.getItem("basket"));
    }
    return [];
  }
}

class Basket {
  static displayBasket() {
    let basketSubtotal = 0;
    const basketContainer = document.querySelector(".basket-container");
    let basketHTML = "";
    basket.forEach(item => {
      item.quantity.forEach((qty, i) => {
        if (qty !== 0) {
          basketSubtotal += Number(item.price[i] * qty);
          basketHTML += `<div class="basket-item">
          <div class="grid-image">
            <img src="${item.productImage}" class="basket-item-image" alt="">
          </div>
          <div class="grid-product basket-item-title-container">
            <h6 class="basket-item-title">${item.title}</h6>
            <div class="backet-item-remove-btn">Remove</div>
          </div>
          <div>
            <h6 class="basket-item-size">${item.productType === "cake"
                                            ? i === 0
                                              ? "Small (6-inch)"
                                              : i === 1
                                                ? "Medium (8-inch)"
                                                : "Large (10-inch)"
                                            : i === 0
                                              ? "1 cupcake"
                                              : "Box of 6 cupcakes"
                                          }</h6>
          </div>
          <div>
            <h6 class="basket-item-price">${item.price[i]}</h6>
          </div>
          <div class="basket-item-qty">
            <i class='bx bx-minus-circle'></i>
            <div class="item-qty">${qty}</div>
            <i class='bx bx-plus-circle'></i>
          </div>
          <div>
            <h6 class="basket-item-subtotal">$${(item.price[i] * qty).toFixed(2)}</h6>
          </div>
        </div>`;
        }
      })
    });
    if (basketHTML === "") {
      basketHTML += `<div class="empty-basket">Your basket is empty</div>`
    }
    basketContainer.innerHTML = basketHTML;

    // update the order total, the delivery (free if order total > $50) and the subtotal
    document.querySelector(".basket-order-total-value").innerHTML = "$" + basketSubtotal.toFixed(2);
    document.querySelector(".basket-delivery-value").innerHTML = basketSubtotal > 50 ? "FREE" : "$14.95";
    document.querySelector(".basket-subtotal-value").innerHTML = basketSubtotal > 50 ? "$" + basketSubtotal.toFixed(2) : "$" + (basketSubtotal + 14.95).toFixed(2);

    // update giftwrapping status
    document.querySelector(".basket-giftwrapping-yes").addEventListener("click", () => {
      document.querySelector(".basket-giftwrapping-yes").classList.add("gift-wrapping-selected");
      document.querySelector(".basket-giftwrapping-no").classList.remove("gift-wrapping-selected");
    });
    document.querySelector(".basket-giftwrapping-no").addEventListener("click", () => {
      document.querySelector(".basket-giftwrapping-no").classList.add("gift-wrapping-selected");
      document.querySelector(".basket-giftwrapping-yes").classList.remove("gift-wrapping-selected");
    });
  }

}

// create instance of DisplayProducts and Products as soon as the page loads
const display = new Display();
const products = new Products();

// getBasket is a static method so no need to create an instance
basket = Storage.getBasket();
numBasketItemsDOM.innerHTML = CalculateItems.calculateItems(basket) || "0";
// if .basket exists, basket.html is the current page, so display the current basket
if (document.querySelector(".basket")) {
  Basket.displayBasket();
} else {
  // call getProducts from the Products class, then pass the product data to the displayProducts method from the Display class
  products.getProducts()
  .then(data => {
    console.log(basket);
    display.displayProducts(data);
  });
}

// Category selection - cakes, cupcakes or everything
const categorySelectBtns = Array.from(document.querySelectorAll(".category-select"));
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
// responsive styles for single product page
// for cupcakes, can buy 1 or 6
