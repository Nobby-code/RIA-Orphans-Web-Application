(() => {
  const container = document.getElementById("eventsContainer");
  if (!container) return;

  const searchInput = document.getElementById("eventSearch");
  const API_BASE = window.API_BASE_URL || window.API_URL || "";

  let events = [];

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

  function parseDate(value) {
    if (!value) return null;

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value) {
    const date = parseDate(value);

    if (!date) return "Date to be confirmed";

    return date.toLocaleDateString("en-KE", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function getKenyaDateKey(value) {
    const date = parseDate(value);
    if (!date) return null;

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Nairobi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const part = (type) => parts.find((p) => p.type === type)?.value;

    return `${part("year")}-${part("month")}-${part("day")}`;
  }

  function getEventStatus(eventDate) {
    const eventDay = getKenyaDateKey(eventDate);

    if (!eventDay) {
      return { label: "Date to be confirmed", className: "bg-secondary" };
    }

    const today = getKenyaDateKey(new Date());

    if (eventDay === today) {
      return { label: "ONGOING", className: "bg-success" };
    }

    if (eventDay > today) {
      return { label: "UPCOMING", className: "bg-primary" };
    }

    return { label: "COMPLETED", className: "bg-secondary" };
  }

  function getImageUrl(value, fallback) {
    const image = String(value || "").trim();

    if (!image) return fallback;

    if (/^https?:\/\//i.test(image) || image.startsWith("/")) {
      return image;
    }

    return image.replace(/^\.\//, "");
  }

  function renderEvents(list) {
    if (!list.length) {
      container.innerHTML = `
        <div class="col-12">
          <div class="bg-white rounded-4 shadow-sm p-5 text-center">
            <i class="far fa-calendar-times fa-3x text-muted mb-3"></i>
            <h4>No events found</h4>
            <p class="text-muted mb-0">
              Please check back for future activities.
            </p>
          </div>
        </div>`;
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort dated events chronologically; undated events come last.
    const sortedEvents = [...list].sort((a, b) => {
      const dateA = parseDate(a.eventDate);
      const dateB = parseDate(b.eventDate);

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      return dateA - dateB;
    });

    container.innerHTML = sortedEvents
      .map((event) => {
        // const eventDate = parseDate(event.eventDate);
        // const isPast = eventDate && eventDate < today;

        // const image =
        //   event.image ||
        //   "images/serednie-ukraine-march-09-2011-portrat-of-romani-schoolgirl-looking-at-the-camera-younger-siblings_t20_JJYomO.jpg";

        const status = getEventStatus(event.eventDate);

        const isToday = status.label === "ONGOING";

        const todayMessage = isToday
          ? `
    <div class="alert alert-success d-flex align-items-center gap-2 py-2 px-3 mb-3">
      <i class="fas fa-calendar-check"></i>
      <div>
        <strong>Happening Today!</strong>
        <div class="small">Join us in making a difference.</div>
      </div>
    </div>
  `
          : "";

        const fallbackImage =
          "images/serednie-ukraine-march-09-2011-portrat-of-romani-schoolgirl-looking-at-the-camera-younger-siblings_t20_JJYomO.jpg";

        const image = getImageUrl(event.image, fallbackImage);

        const programTitle =
          typeof event.program === "object" ? event.program?.title : "";

        return `
        <div class="col-lg-6">
          <article class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
            <div class="row g-0 h-100">
              <div class="col-sm-5">
                <img
                  src="${escapeHTML(image)}"
                  alt="${escapeHTML(event.title || "Foundation event")}"
                  class="w-100 h-100"
                  style="min-height:240px; object-fit:cover"
                  loading="lazy"
                  onerror="this.onerror=null;this.src='images/serednie-ukraine-march-09-2011-portrat-of-romani-schoolgirl-looking-at-the-camera-younger-siblings_t20_JJYomO.jpg'"
                />
              </div>

              <div class="col-sm-7">
                <div class="card-body p-4 d-flex flex-column h-100">
                  ${
                    isToday
                      ? `
      <span class="badge bg-success rounded-pill align-self-start mb-2 px-3 py-2">
        <i class="fas fa-circle me-1"></i> HAPPENING TODAY
      </span>
    `
                      : `
      <span class="badge ${status.className} rounded-pill align-self-start mb-3">
        ${status.label}
      </span>
    `
                  }

        ${todayMessage}

                  <h4 class="card-title">
                    ${escapeHTML(event.title || "Untitled Event")}
                  </h4>

                  <p class="small text-muted mb-2">
                    <i class="far fa-calendar-alt text-primary me-2"></i>
                    ${formatDate(event.eventDate)}
                  </p>

                  <p class="small text-muted mb-2">
                    <i class="fas fa-map-marker-alt text-primary me-2"></i>
                    ${escapeHTML(event.location || "Location to be announced")}
                  </p>

                  ${
                    programTitle
                      ? `<p class="small mb-2">
                          <i class="fas fa-hand-holding-heart text-primary me-2"></i>
                          ${escapeHTML(programTitle)}
                        </p>`
                      : ""
                  }

                  <p class="text-muted mt-2 flex-grow-1">
                    ${escapeHTML(
                      event.description ||
                        "More information about this event will be shared soon.",
                    )}
                  </p>

                  <a
                    href="event-detail.html?id=${encodeURIComponent(event._id || "")}"
                    class="btn btn-outline-primary mt-2 align-self-start"
                  >
                    View Details
                    <i class="fas fa-arrow-right ms-2"></i>
                  </a>
                </div>
              </div>
            </div>
          </article>
        </div>`;
      })
      .join("");
  }

  async function loadEvents() {
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
      const response = await fetch(`${API_BASE}/events`);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();

      if (result.success === false) {
        throw new Error(result.message || "Could not load events.");
      }

      // Supports the event response structure used in your dashboard.
      events = Array.isArray(result.events)
        ? result.events
        : Array.isArray(result.data?.events)
          ? result.data.events
          : Array.isArray(result.data)
            ? result.data
            : [];

      renderEvents(events);
    } catch (error) {
      console.error("Public events error:", error);

      container.innerHTML = `
        <div class="col-12">
          <div class="alert alert-warning text-center">
            <h5>Events are temporarily unavailable</h5>
            <p class="mb-3">Please try again in a moment.</p>
            <button class="btn btn-outline-primary" id="retryEvents">
              Try Again
            </button>
          </div>
        </div>`;

      document
        .getElementById("retryEvents")
        ?.addEventListener("click", loadEvents);
    }
  }

  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();

    renderEvents(
      events.filter((event) =>
        `${event.title || ""} ${event.location || ""} ${event.description || ""}`
          .toLowerCase()
          .includes(query),
      ),
    );
  });

  loadEvents();
})();
