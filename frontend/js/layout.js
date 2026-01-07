async function loadLayout() {
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");

  if (header) {
    header.innerHTML = await fetch("partials/header.html").then((res) =>
      res.text()
    );
  }

  if (footer) {
    footer.innerHTML = await fetch("partials/footer.html").then((res) =>
      res.text()
    );

    // Set current year in footer
    const yearEl = document.getElementById("footerYear");
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }
}

document.addEventListener("DOMContentLoaded", loadLayout);
