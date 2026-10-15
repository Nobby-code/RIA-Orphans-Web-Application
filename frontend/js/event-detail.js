(() => {
  const container = document.getElementById("eventDetailContainer");
  const message = document.getElementById("eventDetailMessage");

  if (!container || !message) return;

  const API_BASE = window.API_BASE_URL || window.API_URL || "";

  const fallbackImage =
    "images/serednie-ukraine-march-09-2011-portrat-of-romani-schoolgirl-looking-at-the-camera-younger-siblings_t20_JJYomO.jpg";

  const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);

  function getImageUrl(value) {
    const image = String(value || "").trim();

    if (!image) return fallbackImage;

    if (/^https?:\/\//i.test(image) || image.startsWith("/")) {
      return image;
    }

    return image.replace(/^\.\//, "");
  }

  function parseDate(value) {
    if (!value) return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value) {
    const date = parseDate(value);

    if (!date) return "Date to be confirmed";

    return date.toLocaleDateString("en-KE", {
      timeZone: "Africa/Nairobi",
      weekday: "long",
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

    const part = (type) => parts.find(p => p.type === type)?.value;

    return `${part("year")}-${part("month")}-${part("day")}`;
  }

  function getEventStatus(eventDate) {
    const eventDay = getKenyaDateKey(eventDate);

    if (!eventDay) {
      return {
        label: "Date to be confirmed",
        className: "bg-secondary",
      };
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

  function extractEvent(result) {
    if (!result) return null;

    if (result.event && !Array.isArray(result.event)) {
      return result.event;
    }

    if (result.data?.event) {
      return result.data.event;
    }

    if (result.data && !Array.isArray(result.data) && result.data._id) {
      return result.data;
    }

    if (result._id) {
      return result;
    }

    return null;
  }

  async function fetchJSON(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
  }

  async function loadEvent() {
    if (!API_BASE) {
      showError("Website API configuration could not be found.");
      return;
    }

    const id = new URLSearchParams(window.location.search).get("id");

    if (!id) {
      showError("No event was selected. Please return to the events page.");
      return;
    }

    try {
      let event = null;

      // Try the single-event endpoint first.
      try {
        const result = await fetchJSON(
          `${API_BASE}/events/${encodeURIComponent(id)}`
        );

        event = extractEvent(result);

        if (result.success === false) {
          event = null;
        }
      } catch (error) {
        // Fall back to the public events list below.
        console.info("Single-event endpoint unavailable; checking event list.");
      }

      // Fallback if GET /events/:id is not implemented.
      if (!event) {
        const result = await fetchJSON(`${API_BASE}/events`);

        const list = Array.isArray(result.events)
          ? result.events
          : Array.isArray(result.data?.events)
            ? result.data.events
            : Array.isArray(result.data)
              ? result.data
              : [];

        event = list.find(item => String(item._id) === String(id));
      }

      if (!event) {
        showError("This event could not be found. It may have been removed.");
        return;
      }

      renderEvent(event);
    } catch (error) {
      console.error("Event details error:", error);
      showError("Event details are temporarily unavailable. Please try again later.");
    }
  }

  function renderEvent(event) {
    const status = getEventStatus(event.eventDate);
    const image = getImageUrl(event.image);

    const programTitle =
      typeof event.program === "object"
        ? event.program?.title
        : "";

    message.innerHTML = "";

    container.innerHTML = `
      <article class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <img
          src="${escapeHTML(image)}"
          alt="${escapeHTML(event.title || "Foundation event")}"
          class="w-100"
          style="max-height:480px; object-fit:cover"
          onerror="this.onerror=null;this.src='${fallbackImage}'"
        />

        <div class="card-body p-4 p-md-5">
          ${
  status.label === "ONGOING"
    ? `
      <div class="alert alert-success mb-4">
        <h5 class="mb-1">
          <i class="fas fa-calendar-check me-2"></i>
          Happening Today!
        </h5>
        <p class="mb-0">
          This event is scheduled for today. Join RIA Orphans Foundation
          in supporting our community.
        </p>
      </div>
    `
    : `
      <span class="badge ${status.className} rounded-pill px-3 py-2 mb-3">
        ${status.label}
      </span>
    `
}

          <h1 class="mb-4">
            ${escapeHTML(event.title || "Untitled Event")}
          </h1>

          <div class="row g-3 mb-4">
            <div class="col-md-6">
              <div class="bg-light rounded-3 p-3 h-100">
                <i class="far fa-calendar-alt text-primary me-2"></i>
                <strong>Event date</strong>
                <div class="mt-2">${escapeHTML(formatDate(event.eventDate))}</div>
              </div>
            </div>

            <div class="col-md-6">
              <div class="bg-light rounded-3 p-3 h-100">
                <i class="fas fa-map-marker-alt text-primary me-2"></i>
                <strong>Location</strong>
                <div class="mt-2">
                  ${escapeHTML(event.location || "To be announced")}
                </div>
              </div>
            </div>
          </div>

          ${
            programTitle
              ? `<p class="mb-4">
                  <i class="fas fa-hand-holding-heart text-primary me-2"></i>
                  <strong>Related program:</strong>
                  ${escapeHTML(programTitle)}
                </p>`
              : ""
          }

          <h3 class="mb-3">About This Event</h3>

          <div class="text-muted" style="white-space:pre-line">
            ${escapeHTML(event.description || "More information will be shared soon.")}
          </div>

          <div class="mt-4 pt-4 border-top">
            <a href="event-list.html" class="btn btn-primary">
              <i class="fas fa-arrow-left me-2"></i>
              Back to All Events
            </a>
          </div>
        </div>
      </article>
    `;

    document.title =
      `${event.title || "Event Details"} - Ria Orphans Foundation`;
  }

  function showError(text) {
    message.innerHTML = `
      <div class="alert alert-warning text-center">
        <h5>Unable to display this event</h5>
        <p>${escapeHTML(text)}</p>
        <a href="event-list.html" class="btn btn-outline-primary">
          Back to Events
        </a>
      </div>
    `;

    container.innerHTML = "";
  }

  loadEvent();
})();