const submitBtn = document.querySelector(".btn-send-message");
const sendMessage = e => {
  // if required fields are filled, submit the form and display the sent message
  let requiredFields = Array.from(document.querySelectorAll(".field-required"))
  if (requiredFields.every(field => field.value !== "")) {
    e.preventDefault();
    document.querySelector(".sent-message").classList.add("sent");
  }
}
submitBtn.addEventListener("click", sendMessage);
