 function flipTo(id, newNumber) {
  const el = document.getElementById(id);
  const current = el.getAttribute("data-num") || "00";
  const labelText = el.querySelector(".label").textContent; // get label text

  newNumber = String(newNumber).padStart(2, "0");
  if (current === newNumber) return; // only flip if changed

  el.setAttribute("data-num", newNumber);

  // Include label in innerHTML
  el.innerHTML = `
    <div class="label">${labelText}</div>
    <div class="digit">
      <div class="top">${current}</div>
      <div class="bottom">${current}</div>
      <div class="flip">${current}</div>
    </div>
  `;

  const flip = el.querySelector(".flip");
  flip.classList.add("animate");

  flip.addEventListener("animationend", () => {
    el.innerHTML = `
      <div class="label">${labelText}</div>
      <div class="digit">
        <div class="top">${newNumber}</div>
        <div class="bottom">${newNumber}</div>
      </div>
    `;
  });
}


// Initial values
let weeks = 2;
let days = 3;
let hours = 5;
let minutes = 30;
let seconds = 60;

// Initial render
flipTo("weeks", weeks);
flipTo("days", days);
flipTo("hours", hours);
flipTo("minutes", minutes);
flipTo("seconds", seconds);

setInterval(() => {
  // Flip only if values changed
  flipTo("seconds", seconds);
  if (seconds === 0) {
    flipTo("minutes", minutes);
    minutes = (minutes - 1 + 60) % 60;

    if (minutes === 59) {
      flipTo("hours", hours);
      hours = (hours - 1 + 24) % 24;

      if (hours === 23) {
        flipTo("days", days);
        days = (days - 1 + 7) % 7;

        if (days === 6) {
          flipTo("weeks", weeks);
          weeks = (weeks - 1 + 52) % 52;
        }
      }
    }
  }

  // Update seconds
  seconds = (seconds - 1 + 60) % 60;

}, 1000);