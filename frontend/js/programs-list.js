(() => {
  const container = document.getElementById("programsContainer");
  if (!container) return;

  const searchInput = document.getElementById("programSearch");
  const countElement = document.getElementById("programCount");

  // Use the API base URL already configured by your website.
  const API_BASE = window.API_BASE_URL || window.API_URL || "";

  let programs = [];

  const escapeHTML = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );

  const formatDate = (value) => {
    if (!value) return "To be announced";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "To be announced"
      : date.toLocaleDateString("en-KE", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  function getStatus(program) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = program.startDate ? new Date(program.startDate) : null;
    const end = program.endDate ? new Date(program.endDate) : null;

    if (start && !Number.isNaN(start.getTime())) {
      start.setHours(0, 0, 0, 0);
    }

    if (end && !Number.isNaN(end.getTime())) {
      end.setHours(0, 0, 0, 0);
    }

    if (end && !Number.isNaN(end.getTime()) && end < today) {
      return { label: "Completed", className: "bg-secondary" };
    }

    if (start && !Number.isNaN(start.getTime()) && start > today) {
      return { label: "Upcoming", className: "bg-info text-dark" };
    }

    if (
      (!start || Number.isNaN(start.getTime()) || start <= today) &&
      (!end || Number.isNaN(end.getTime()) || end >= today)
    ) {
      return { label: "Ongoing", className: "bg-success" };
    }

    return { label: "Scheduled", className: "bg-secondary" };
  }

  function getImageUrl(value, fallback) {
    const image = String(value || "").trim();

    if (!image) return fallback;

    // Support full URLs, root-relative paths and relative paths.
    if (/^https?:\/\//i.test(image) || image.startsWith("/")) {
      return image;
    }

    return image.replace(/^\.\//, "");
  }

  function renderPrograms(list) {
    countElement.textContent = `${list.length} program${list.length === 1 ? "" : "s"}`;

    if (!list.length) {
      container.innerHTML = `
        <div class="col-12">
          <div class="text-center bg-light rounded-4 p-5">
            <i class="fas fa-search fa-2x text-muted mb-3"></i>
            <h4>No programs found</h4>
            <p class="text-muted mb-0">
              Try another search or check back later.
            </p>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = list
      .map((program) => {
        const status = getStatus(program);

        // Use a program image when available; otherwise use
        // a local image already in the website's images folder.
        const fallbackImage =
          "images/asian-beautiful-boy-charity-cheerful-child-childhood-children-color-cute-dress-education-emotion_t20_b6GeGV.jpg";

        const image = getImageUrl(program.image, fallbackImage);
        
        return `
        <div class="col-lg-4 col-md-6">
          <article class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
            <img
              src="${escapeHTML(image)}"
              alt="${escapeHTML(program.title)}"
              class="card-img-top"
              style="height:230px; object-fit:cover"
              loading="lazy"
              onerror="this.onerror=null;this.src='images/asian-beautiful-boy-charity-cheerful-child-childhood-children-color-cute-dress-education-emotion_t20_b6GeGV.jpg'"
            />

            <div class="card-body p-4 d-flex flex-column">
              <div class="mb-3">
                <span class="badge ${status.className} rounded-pill px-3 py-2">
                  ${status.label}
                </span>
              </div>

              <h4 class="card-title">
                ${escapeHTML(program.title || "Untitled Program")}
              </h4>

              <p class="text-muted flex-grow-1" style="white-space:pre-line">
                ${escapeHTML(
                  program.description ||
                    "More information about this program will be shared soon.",
                )}
              </p>

              <div class="border-top pt-3 mb-3">
                <p class="small mb-2">
                  <i class="far fa-calendar-alt text-primary me-2"></i>
                  <strong>Starts:</strong>
                  ${formatDate(program.startDate)}
                </p>

                <p class="small mb-0">
                  <i class="far fa-calendar-check text-primary me-2"></i>
                  <strong>Ends:</strong>
                  ${formatDate(program.endDate)}
                </p>
              </div>

              <a
                href="donation-form.html"
                class="btn btn-primary mt-auto"
              >
                Support Our Work
                <i class="fas fa-arrow-right ms-2"></i>
              </a>
            </div>
          </article>
        </div>`;
      })
      .join("");
  }

  async function loadPrograms() {
    if (!API_BASE) {
      container.innerHTML = `
        <div class="col-12">
          <div class="alert alert-warning">
            The website API configuration could not be found.
          </div>
        </div>`;
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/programs`);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();

      if (result.success === false) {
        throw new Error(result.message || "Could not load programs.");
      }

      programs = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.programs)
          ? result.programs
          : [];

      renderPrograms(programs);
    } catch (error) {
      console.error("Public programs error:", error);

      countElement.textContent = "";

      container.innerHTML = `
        <div class="col-12">
          <div class="alert alert-warning text-center">
            <h5>Programs are temporarily unavailable</h5>
            <p class="mb-3">
              Please try again in a moment.
            </p>
            <button class="btn btn-outline-primary" id="retryPrograms">
              Try Again
            </button>
          </div>
        </div>`;

      document
        .getElementById("retryPrograms")
        ?.addEventListener("click", loadPrograms);
    }
  }

  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();

    renderPrograms(
      programs.filter((program) =>
        `${program.title || ""} ${program.description || ""}`
          .toLowerCase()
          .includes(query),
      ),
    );
  });

  loadPrograms();
})();
