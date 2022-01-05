"use strict";
const submitBtn = document.querySelector(".btn-send-message");
submitBtn.addEventListener("click", e => {
    e.preventDefault();
    document.querySelector(".contact-container").classList.add("btn-clicked");
});
//# sourceMappingURL=main.js.map