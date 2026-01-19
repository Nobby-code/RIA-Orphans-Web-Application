const API_URL = window.API_BASE_URL;


// HANDLE AUTH ERRORS
async function handleResponse(response) {
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "login.html";
    return;
  }
  return response.json();
}

// LOGIN FUNCTION
async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  // return response.json();
  return handleResponse(response);
}

// CREATE ORPHAN FUNCTION
async function createOrphan(formData) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/orphans`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`, // ❗ NO content-type for files
    },
    body: formData,
  });

  // return response.json();
  return handleResponse(response);
}

// GET ORPHANS
// async function getOrphans() {
//   const response = await fetch(`${API_URL}/orphans`);
//   return response.json();
// }

// async function getOrphans(page = 1, limit = 8) {
//   return fetch(`${API_URL}/orphans?page=${page}&limit=${limit}`).then((res) =>
//     res.json()
//   );
// }

async function getOrphans(page = 1, limit = 8) {
  return fetch(`${API_URL}/orphans?page=${page}&limit=${limit}`).then(handleResponse);
}

// GET WIDOWS
// async function getWidows() {
//   const response = await fetch(`${API_URL}/widows`);
//   return response.json();
// }

// async function getWidows(page = 1, limit = 8) {
//   return fetch(`${API_URL}/widows?page=${page}&limit=${limit}`).then((res) =>
//     res.json()
//   );
// }

async function getWidows(page = 1, limit = 8) {
  return fetch(`${API_URL}/widows?page=${page}&limit=${limit}`).then(handleResponse);
}
