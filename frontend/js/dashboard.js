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
          <td colspan="6" class="text-center">No orphans found</td>
        </tr>
      `;
          return;
        }

        data.data.forEach((orphan, index) => {
          tableBody.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${orphan.name}</td>
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
      } catch (error) {
        console.error(error);
        tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-danger">
          Failed to load orphans
        </td>
      </tr>
    `;
      }
    }

// Load Widows Page
async function loadWidowsPage() {
  const tableBody = document.getElementById("widowsTableBody");
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

    data.data.forEach((widow, index) => {
      tableBody.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${widow.name}</td>
          <td>${widow.age || "-"}</td>
          <td>${widow.numberOfChildren || "-"}</td>
          <td>${widow.location || "-"}</td>
          <td>${widow.description || "-"}</td>
          <td>
            <button class="btn btn-sm btn-warning">Edit</button>
          </td>
        </tr>
      `;
    });
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

// Load Programs Page
async function loadProgramsPage() {
  const tableBody = document.getElementById("programsTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = `<div class="d-flex justify-content-center align-items-center gap-2">
  <div class="spinner-border text-primary" role="status"></div>
  <span>Loading data, please wait...</span>
</div>`;

  try {
    const res = await fetch(`${API_URL}/programs`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await res.json();
    tableBody.innerHTML = "";

    if (!data.success || data.data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No programs found</td></tr>`;
      return;
    }

    data.data.forEach((program, index) => {
      tableBody.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${program.title}</td>
          <td>${program.description || "-"}</td>
          <td>${program.startDate ? new Date(program.startDate).toLocaleDateString() : "-"}</td>
          <td>${program.endDate ? new Date(program.endDate).toLocaleDateString() : "-"}</td>
          <td>
            <button class="btn btn-sm btn-warning">Edit</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error(err);
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load programs</td></tr>`;
  }
}

// Load Events Page
async function loadEventsPage() {
  const tableBody = document.getElementById("eventsTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = `<div class="d-flex justify-content-center align-items-center gap-2">
  <div class="spinner-border text-primary" role="status"></div>
  <span>Loading data, please wait...</span>
</div>`;

  try {
    const res = await fetch(`${API_URL}/events`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await res.json();
    tableBody.innerHTML = "";

    if (!data.success || data.events.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No events found</td></tr>`;
      return;
    }

    data.events.forEach((event, index) => {
      tableBody.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${event.title}</td>
          <td>${event.description || "-"}</td>
          <td>${event.location || "-"}</td>
          <td>${event.eventDate ? new Date(event.eventDate).toLocaleDateString() : "-"}</td>
          <td>${event.program ? event.program.title : "-"}</td>
          <td>
            <button class="btn btn-sm btn-warning">Edit</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error(err);
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load events</td></tr>`;
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
          <td>${user.role}</td>
          <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</td>
          <td>
            <button class="btn btn-sm btn-warning">Edit</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error(err);
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load users</td></tr>`;
  }
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
