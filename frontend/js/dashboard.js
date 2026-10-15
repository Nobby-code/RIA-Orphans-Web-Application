async function fetchAllRecords(endpoint) {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const limit = 100;

  // Fetch the first page and get the total number of pages.
  const firstResponse = await fetch(
    `${API_URL}/${endpoint}?page=1&limit=${limit}`,
    { headers },
  );

  if (!firstResponse.ok) {
    throw new Error(`Failed to load ${endpoint}: ${firstResponse.status}`);
  }

  const firstResult = await firstResponse.json();

  if (!Array.isArray(firstResult.data)) {
    throw new Error(`Invalid response received for ${endpoint}`);
  }

  const records = [...firstResult.data];
  const totalPages = firstResult.pagination?.totalPages ?? 1;

  // Fetch the remaining pages.
  for (let page = 2; page <= totalPages; page++) {
    const response = await fetch(
      `${API_URL}/${endpoint}?page=${page}&limit=${limit}`,
      { headers },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to load ${endpoint}, page ${page}: ${response.status}`,
      );
    }

    const result = await response.json();

    if (!Array.isArray(result.data)) {
      throw new Error(`Invalid response for ${endpoint}, page ${page}`);
    }

    records.push(...result.data);
  }

  return records;
}

let allOrphansList = [];
let allWidowsList = [];

function renderOrphansList(list) {
  const tableBody = document.getElementById("orphansTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (list.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center">No results found</td>
      </tr>
    `;
    return;
  }

  list.forEach((orphan, index) => {
    tableBody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>
          <img src="${orphan.image || "images/volunteer-holding-cardboard-box-2021-09-01-15-27-23-utc.jpg"}" alt="" class="img-thumbnail" style="max-width: 50px; height: auto;" />
        </td>
        <td>${orphan.programNumber || "-"}</td>
        <td>${orphan.name || "-"}</td>
        <td>${orphan.contact || "-"}</td>
        <td>${orphan.age || "-"}</td>
        <td>${orphan.gender || "-"}</td>
        <td>${orphan.description || "-"}</td>
        <td>
          <button class="btn btn-sm btn-warning"
            onclick='openModal(${JSON.stringify(orphan)})'>
            Edit
          </button>
        </td>
      </tr>
    `;
  });
}

function renderWidowsList(list) {
  const tableBody = document.getElementById("widowsTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (list.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">No results found</td>
      </tr>
    `;
    return;
  }

  list.forEach((widow, index) => {
    tableBody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>
          <img src="${widow.image || "images/volunteer-holding-cardboard-box-2021-09-01-15-27-23-utc.jpg"}" alt="" class="img-thumbnail" style="max-width: 50px; height: auto;" />
        </td>
        <td>${widow.programNumber || "-"}</td>
        <td>${widow.name || "-"}</td>
        <td>${widow.age || "-"}</td>
        <td>${widow.children || "-"}</td>
        <td>${widow.location || "-"}</td>
        <td>${widow.description || "-"}</td>
        <td>
          <button class="btn btn-sm btn-warning"
            onclick="openWidowModal('${widow._id}')">
            <i class="fas fa-edit"></i> Edit
          </button>
        </td>
      </tr>
    `;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("[data-page]");
  const contentArea = document.getElementById("content");

  links.forEach((link) => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();

      const page = link.getAttribute("data-page");

      // Active sidebar highlight
      links.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      try {
        const res = await fetch(`partials/${page}.html`);
        const html = await res.text();
        contentArea.innerHTML = html;

        // if (page === "orphans") {
        //   loadOrphansPage();
        // }

        // Call correct data loader
        PAGE_LOADERS[page]?.();
      } catch (error) {
        contentArea.innerHTML = "<p>Error loading content</p>";
      }
    });
  });
});

// Load Orphans Page
async function loadOrphansPage() {
  const tableBody = document.getElementById("orphansTableBody");
  const searchInputL = document.getElementById("searchOrphansList");
  if (!tableBody) return;

  tableBody.innerHTML = `
    <div class="d-flex justify-content-center align-items-center gap-2">
  <div class="spinner-border text-primary" role="status"></div>
  <span>Loading data, please wait...</span>
</div>
  `;

  try {
    const res = await fetch(`${API_URL}/orphans`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await res.json();
    tableBody.innerHTML = "";

    if (!data.success || data.data.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center">No orphans found</td>
        </tr>
      `;
      return;
    }

    // allOrphansList = data.data;
    allOrphansList = await fetchAllRecords("orphans");

    // Render initial table
    renderOrphansList(allOrphansList);

    if (searchInputL) {
      searchInputL.addEventListener("input", function () {
        const value = this.value.toLowerCase();

        const filtered = allOrphansList.filter(
          (o) =>
            (o.name || "").toLowerCase().includes(value) ||
            (o.programNumber || "").toLowerCase().includes(value) ||
            (o.gender || "").toLowerCase().includes(value) ||
            (o.description || "").toLowerCase().includes(value),
        );
        renderOrphansList(filtered);
      });
    }
  } catch (error) {
    console.error(error);
    tableBody.innerHTML = `<tr>
        <td colspan="9" class="text-center text-danger">
          Failed to load orphans
        </td>
      </tr>
    `;
  }
}

// Load Widows Page
async function loadWidowsPage() {
  const tableBody = document.getElementById("widowsTableBody");
  const searchInputW = document.getElementById("searchWidowsList");
  if (!tableBody) return;

  tableBody.innerHTML = `
    <div class="d-flex justify-content-center align-items-center gap-2">
  <div class="spinner-border text-primary" role="status"></div>
  <span>Loading data, please wait...</span>
</div>
  `;

  try {
    const res = await fetch(`${API_URL}/widows`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await res.json();
    tableBody.innerHTML = "";

    if (!data.success || data.data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No widows found</td></tr>`;
      return;
    }

    // allWidowsList = data.data;

    allWidowsList = await fetchAllRecords("widows");

    renderWidowsList(allWidowsList);

    if (searchInputW) {
      searchInputW.addEventListener("input", function () {
        const value = this.value.toLowerCase();

        const filtered = allWidowsList.filter(
          (w) =>
            (w.name || "").toLowerCase().includes(value) ||
            (w.programNumber || "").toLowerCase().includes(value) ||
            (w.gender || "").toLowerCase().includes(value) ||
            (w.description || "").toLowerCase().includes(value),
        );
        renderWidowsList(filtered);
      });
    }
  } catch (err) {
    console.error(err);
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load widows</td></tr>`;
  }
}

// Load Donors Page
async function loadDonorsPage() {
  const tableBody = document.getElementById("donorsTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = `<div class="d-flex justify-content-center align-items-center gap-2">
  <div class="spinner-border text-primary" role="status"></div>
  <span>Loading data, please wait...</span>
</div>`;

  try {
    const res = await fetch(`${API_URL}/donors`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await res.json();
    tableBody.innerHTML = "";

    if (!data.success || data.data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No donors found</td></tr>`;
      return;
    }

    data.data.forEach((donor, index) => {
      tableBody.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${donor.fullName}</td>
          <td>${donor.email || "-"}</td>
          <td>${donor.phone || "-"}</td>
          <td>${donor.amount || 0}</td>
          <td>${donor.createdAt ? new Date(donor.createdAt).toLocaleDateString() : "-"}</td>
          <td>
            <button class="btn btn-sm btn-warning">Edit</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error(err);
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load donors</td></tr>`;
  }
}

// Load Donations Page
async function loadDonationsPage() {
  const tableBody = document.getElementById("donationsTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = `<div class="d-flex justify-content-center align-items-center gap-2">
  <div class="spinner-border text-primary" role="status"></div>
  <span>Loading data, please wait...</span>
</div>`;

  try {
    const res = await fetch(`${API_URL}/donations`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await res.json();
    tableBody.innerHTML = "";

    if (!data.success || data.data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No donations found</td></tr>`;
      return;
    }

    data.data.forEach((donation, index) => {
      tableBody.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${donation.fullName || "-"}</td>
          <td>${donation.amount || "-"}</td>
          <td>${donation.email || "-"}</td>
          <td>${donation.createdAt ? new Date(donation.createdAt).toLocaleDateString() : "-"}</td>
          <td>${donation.beneficiaryId || "-"}</td>
          <td>
            <button class="btn btn-sm btn-warning">Edit</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error(err);
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load donations</td></tr>`;
  }
}

function setupProgramImagePreviews() {
  const createInput = document.getElementById("programImage");
  const createPreview = document.getElementById("programImagePreview");
  const createWrapper = document.getElementById(
    "programImagePreviewWrapper"
  );

  const editInput = document.getElementById("editProgramImage");
  const editPreview = document.getElementById("editProgramImagePreview");
  const editWrapper = document.getElementById(
    "editProgramImagePreviewWrapper"
  );

  function connectPreview(input, preview, wrapper) {
    if (!input || !preview || !wrapper) return;

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;

      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        input.value = "";
        alert("Please select a JPG, PNG, or WebP image.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        input.value = "";
        alert("The image must be 5 MB or smaller.");
        return;
      }

      preview.src = URL.createObjectURL(file);
      wrapper.classList.remove("d-none");
    });
  }

  connectPreview(createInput, createPreview, createWrapper);
  connectPreview(editInput, editPreview, editWrapper);
}

// Load Programs Page
async function loadProgramsPage() {
  const tableBody = document.getElementById("programsTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = `
    <tr>
      <td colspan="7" class="text-center">
        <div class="spinner-border spinner-border-sm text-primary me-2"></div>
        Loading programs...
      </td>
    </tr>
  `;

  try {
    const response = await fetch(`${API_URL}/programs`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to load programs.");
    }

    const programs = result.data || [];

    if (!programs.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center">No programs found</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = programs
      .map(
        (program, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeEventHtml(program.title || "-")}</td>
            <td>${escapeEventHtml(program.description || "-")}</td>
            <td>
              ${
                program.startDate
                  ? new Date(program.startDate).toLocaleDateString()
                  : "-"
              }
            </td>
            <td>
              ${
                program.endDate
                  ? new Date(program.endDate).toLocaleDateString()
                  : "-"
              }
            </td>
            <td>
              ${
                program.createdAt
                  ? new Date(program.createdAt).toLocaleDateString()
                  : "-"
              }
            </td>
            <td class="text-nowrap">
              <button
                type="button"
                class="btn btn-sm btn-warning me-1"
                data-program-action="edit"
                data-program-id="${escapeEventHtml(program._id)}"
              >
                <i class="fas fa-edit"></i> Edit
              </button>

              <button
                type="button"
                class="btn btn-sm btn-danger"
                data-program-action="delete"
                data-program-id="${escapeEventHtml(program._id)}"
              >
                <i class="fas fa-trash"></i> Delete
              </button>
            </td>
          </tr>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Load programs error:", error);

    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger">
          ${escapeEventHtml(error.message || "Failed to load programs.")}
        </td>
      </tr>
    `;
  }
}

/**
 * Create a program.
 * This listener works with dynamically loaded partial HTML.
 */
document.addEventListener("submit", async (e) => {
  if (e.target.id !== "createProgramForm") return;

  e.preventDefault();

  const form = e.target;
  const saveButton = document.getElementById("createProgramButton");
  const messageBox = document.getElementById("createProgramMessage");

  const title = document.getElementById("programTitle").value.trim();
  const description = document
    .getElementById("programDescription")
    .value.trim();
  const startDate = document.getElementById("programStartDate").value;
  const endDate = document.getElementById("programEndDate").value;

  messageBox.textContent = "";
  messageBox.className = "mb-3";

  if (!title) {
    messageBox.textContent = "Please enter a program name.";
    messageBox.classList.add("text-danger");
    return;
  }

  if (startDate && endDate && endDate < startDate) {
    messageBox.textContent = "End date cannot be earlier than start date.";
    messageBox.classList.add("text-danger");
    return;
  }

  saveButton.disabled = true;
  saveButton.textContent = "Saving...";

  try {
    const response = await fetch(`${API_URL}/programs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        title,
        description,
        startDate: startDate || null,
        endDate: endDate || null,
      }),
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Failed to create program.");
    }

    messageBox.textContent = result.message || "Program created successfully.";
    messageBox.classList.add("text-success");

    form.reset();

    // Reload the table to display the newly created program.
    await loadProgramsPage();
  } catch (error) {
    console.error("Create program error:", error);
    messageBox.textContent = error.message || "Failed to create program.";
    messageBox.classList.add("text-danger");
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Save Program";
  }
});


// Convert a date to YYYY-MM-DD for the date inputs.
function formatProgramDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 10);
}

// Handle Edit and Delete button clicks.
document.addEventListener("click", async (e) => {
  const button = e.target.closest("button[data-program-action]");

  if (!button) return;

  const action = button.dataset.programAction;
  const programId = button.dataset.programId;

  if (!programId) {
    alert("Program ID is missing.");
    return;
  }

  if (action === "edit") {
    await openEditProgramModal(programId);
  }

  if (action === "delete") {
    await deleteProgramRecord(programId, button);
  }
});

// Fetch a program and open the Edit modal.
async function openEditProgramModal(programId) {
  const messageBox = document.getElementById("editProgramMessage");
  const form = document.getElementById("editProgramForm");

  if (!form || !messageBox) {
    alert("The Edit Program form could not be found.");
    return;
  }

  form.reset();
  messageBox.className = "alert d-none";

  try {
    const response = await fetch(
      `${API_URL}/programs/${encodeURIComponent(programId)}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Could not load this program.");
    }

    // Support either { success: true, data: {...} }
    // or a response containing the program directly.
    const program = result.data || result.program || result;

    document.getElementById("editProgramId").value = program._id;
    document.getElementById("editProgramTitle").value =
      program.title || "";
    document.getElementById("editProgramDescription").value =
      program.description || "";
    document.getElementById("editProgramStartDate").value =
      formatProgramDate(program.startDate);
    document.getElementById("editProgramEndDate").value =
      formatProgramDate(program.endDate);

    bootstrap.Modal.getOrCreateInstance(
      document.getElementById("editProgramModal")
    ).show();
  } catch (error) {
    console.error("Open edit program error:", error);
    alert(error.message || "Could not open the program for editing.");
  }
}

// Save the edited program.
document.addEventListener("submit", async (e) => {
  if (e.target.id !== "editProgramForm") return;

  e.preventDefault();

  const messageBox = document.getElementById("editProgramMessage");
  const saveButton = document.getElementById("saveProgramChanges");

  const programId = document.getElementById("editProgramId").value;
  const title = document.getElementById("editProgramTitle").value.trim();
  const description = document
    .getElementById("editProgramDescription")
    .value.trim();
  const startDate = document.getElementById("editProgramStartDate").value;
  const endDate = document.getElementById("editProgramEndDate").value;

  messageBox.className = "alert d-none";

  if (!title) {
    messageBox.textContent = "Please enter a program name.";
    messageBox.className = "alert alert-danger";
    return;
  }

  if (startDate && endDate && endDate < startDate) {
    messageBox.textContent =
      "End date cannot be earlier than start date.";
    messageBox.className = "alert alert-danger";
    return;
  }

  saveButton.disabled = true;
  saveButton.textContent = "Saving...";

  try {
    const response = await fetch(
      `${API_URL}/programs/${encodeURIComponent(programId)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title,
          description,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Failed to update program.");
    }

    bootstrap.Modal.getOrCreateInstance(
      document.getElementById("editProgramModal")
    ).hide();

    await loadProgramsPage();

    alert(result.message || "Program updated successfully.");
  } catch (error) {
    console.error("Update program error:", error);
    messageBox.textContent =
      error.message || "Failed to update program.";
    messageBox.className = "alert alert-danger";
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Save Changes";
  }
});

// Confirm and delete a program.
async function deleteProgramRecord(programId, button) {
  const confirmed = confirm(
    "Are you sure you want to delete this program? This action cannot be undone."
  );

  if (!confirmed) return;

  button.disabled = true;
  button.textContent = "Deleting...";

  try {
    const response = await fetch(
      `${API_URL}/programs/${encodeURIComponent(programId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Failed to delete program.");
    }

    await loadProgramsPage();

    alert(result.message || "Program deleted successfully.");
  } catch (error) {
    console.error("Delete program error:", error);
    alert(error.message || "Failed to delete program.");

    button.disabled = false;
    button.innerHTML = '<i class="fas fa-trash"></i> Delete';
  }
}

// Load Events Page

async function loadEventsPage() {
  const tableBody = document.getElementById("eventsTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = `
    <tr>
      <td colspan="7" class="text-center">
        <div class="spinner-border spinner-border-sm text-primary me-2"></div>
        Loading events...
      </td>
    </tr>`;

  try {
    const res = await fetch(`${API_URL}/events`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to load events.");
    }

    if (!Array.isArray(data.events) || data.events.length === 0) {
      tableBody.innerHTML = `
        <tr><td colspan="7" class="text-center">No events found</td></tr>`;
      return;
    }

    tableBody.innerHTML = data.events
      .map(
        (event, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeEventHtml(event.title || "-")}</td>
        <td>${escapeEventHtml(event.description || "-")}</td>
        <td>${escapeEventHtml(event.location || "-")}</td>
        <td>${
          event.eventDate ? new Date(event.eventDate).toLocaleDateString() : "-"
        }</td>
        <td>${escapeEventHtml(event.program?.title || "-")}</td>
        <td class="text-nowrap">
          <button type="button"
                  class="btn btn-sm btn-warning me-1"
                  data-event-action="edit"
                  data-event-id="${event._id}">
            Edit
          </button>
          <button type="button"
                  class="btn btn-sm btn-danger"
                  data-event-action="delete"
                  data-event-id="${event._id}">
            Delete
          </button>
        </td>
      </tr>
    `,
      )
      .join("");

    // Add one delegated click handler to the current table body.
    // Replacing the body HTML does not remove this listener.

    document.addEventListener("click", async (e) => {
      const button = e.target.closest("button[data-event-action]");
      if (!button) return;

      const action = button.dataset.eventAction;
      const eventId = button.dataset.eventId;

      console.log("Event action clicked:", action, eventId);

      if (!eventId) {
        alert("The event ID is missing from this button.");
        return;
      }

      if (action === "edit") {
        if (typeof openEditEventModal !== "function") {
          alert("The edit function is not available.");
          return;
        }

        await openEditEventModal(eventId);
      } else if (action === "delete") {
        await deleteEventRecord(eventId, button);
      }
    });
  } catch (err) {
    console.error("Load events error:", err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger">
          ${escapeEventHtml(err.message || "Failed to load events")}
        </td>
      </tr>`;
  }
}

// Escape values before inserting API data into table HTML.
function escapeEventHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

// Load programs into the edit modal's dropdown.
async function loadEventPrograms(selectedProgramId = "") {
  const select = document.getElementById("editEventProgram");
  if (!select) return;

  const response = await fetch(`${API_URL}/programs`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Could not load programs.");
  }

  select.innerHTML = '<option value="">No program selected</option>';

  (result.data || []).forEach((program) => {
    const option = document.createElement("option");
    option.value = program._id;
    option.textContent = program.title;
    option.selected = program._id === selectedProgramId;
    select.appendChild(option);
  });
}

// Fetch an event and open the edit modal.
async function openEditEventModal(eventId) {
  const errorBox = document.getElementById("editEventError");
  const form = document.getElementById("editEventForm");

  errorBox.classList.add("d-none");
  form.reset();

  try {
    const response = await fetch(`${API_URL}/events/${eventId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const event = await response.json();

    if (!response.ok || event.message === "Event not found") {
      throw new Error(event.message || "Could not load this event.");
    }

    document.getElementById("editEventId").value = event._id;
    document.getElementById("editEventTitle").value = event.title || "";
    document.getElementById("editEventDescription").value =
      event.description || "";
    document.getElementById("editEventLocation").value = event.location || "";

    if (event.eventDate) {
      const date = new Date(event.eventDate);
      const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000,
      );
      document.getElementById("editEventDate").value = localDate
        .toISOString()
        .slice(0, 10);
    }

    await loadEventPrograms(event.program?._id || "");

    bootstrap.Modal.getOrCreateInstance(
      document.getElementById("editEventModal"),
    ).show();
  } catch (error) {
    console.error("Open edit event error:", error);
    alert(error.message || "Could not open the event for editing.");
  }
}

// Save changes to an event.
document.addEventListener("submit", async (e) => {
  if (e.target.id !== "editEventForm") return;

  e.preventDefault();

  const form = e.target;
  const saveButton = document.getElementById("saveEventChanges");
  const errorBox = document.getElementById("editEventError");
  const eventId = document.getElementById("editEventId").value;

  errorBox.classList.add("d-none");
  saveButton.disabled = true;
  saveButton.textContent = "Saving...";

  try {
    const formData = new FormData();

    formData.append(
      "title",
      document.getElementById("editEventTitle").value.trim(),
    );
    formData.append(
      "description",
      document.getElementById("editEventDescription").value.trim(),
    );
    formData.append(
      "location",
      document.getElementById("editEventLocation").value.trim(),
    );
    formData.append(
      "eventDate",
      document.getElementById("editEventDate").value,
    );

    // Send an empty value when clearing the program association.
    formData.append(
      "program",
      document.getElementById("editEventProgram").value,
    );

    const image = document.getElementById("editEventImage").files[0];
    if (image) formData.append("image", image);

    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Failed to update event.");
    }

    bootstrap.Modal.getOrCreateInstance(
      document.getElementById("editEventModal"),
    ).hide();

    await loadEventsPage();
    alert("Event updated successfully.");
  } catch (error) {
    console.error("Update event error:", error);
    errorBox.textContent = error.message || "Failed to update event.";
    errorBox.classList.remove("d-none");
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Save Changes";
  }
});

// Confirm and delete an event.
async function deleteEventRecord(eventId, button) {
  const confirmed = confirm(
    "Are you sure you want to delete this event? This action cannot be undone.",
  );

  if (!confirmed) return;

  button.disabled = true;
  button.textContent = "Deleting...";

  try {
    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Failed to delete event.");
    }

    await loadEventsPage();
    alert(result.message || "Event deleted successfully.");
  } catch (error) {
    console.error("Delete event error:", error);
    alert(error.message || "Failed to delete event.");
    button.disabled = false;
    button.textContent = "Delete";
  }
}

// Load Users Page
async function loadUsersPage() {
  const tableBody = document.getElementById("usersTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = `<div class="d-flex justify-content-center align-items-center gap-2">
  <div class="spinner-border text-primary" role="status"></div>
  <span>Loading data, please wait...</span>
</div>`;

  try {
    const res = await fetch(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await res.json();
    tableBody.innerHTML = "";

    if (!data.success || data.data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No users found</td></tr>`;
      return;
    }

    data.data.forEach((user, index) => {
      tableBody.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${user.phone || "-"}</td>
          <td>${user.role}</td>
          <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</td>
          <td>
            <button class="btn btn-sm btn-warning " onclick="showEditUserForm(${JSON.stringify(user).replace(/"/g, "&quot;")})">Edit</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error(err);
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load users</td></tr>`;
  }
}

// Search functionality for orphans

const searchOrphansInput = document.getElementById("searchOrphans");

if (searchOrphansInput) {
  searchOrphansInput.addEventListener("input", function () {
    const value = this.value.toLowerCase();

    const filtered = allOrphans.filter(
      (o) =>
        (o.name || "").toLowerCase().includes(value) ||
        (o.programNumber || "").toLowerCase().includes(value) ||
        (o.gender || "").toLowerCase().includes(value) ||
        (o.description || "").toLowerCase().includes(value),
    );

    renderOrphans(filtered);
  });
}
// Search functionality for widows
const searchWidowsInput2 = document.getElementById("searchWidows");

if (searchWidowsInput2) {
  searchWidowsInput2.addEventListener("input", function () {
    const value = this.value.toLowerCase();

    const filtered = allWidows.filter(
      (w) =>
        (w.name || "").toLowerCase().includes(value) ||
        (w.numberOfChildren || "").toString().toLowerCase().includes(value) ||
        (w.location || "").toLowerCase().includes(value),
    );

    renderWidows(filtered);
  });
}
const PAGE_LOADERS = {
  orphans: loadOrphansPage,
  widows: loadWidowsPage,
  donors: loadDonorsPage,
  donations: loadDonationsPage,
  programs: loadProgramsPage,
  events: loadEventsPage,
  users: loadUsersPage,
};
