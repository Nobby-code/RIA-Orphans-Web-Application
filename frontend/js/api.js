console.log("API BASE URL:", window.API_BASE_URL);

const API_URL = window.API_BASE_URL;

if (!API_URL) {
  console.error("API_BASE_URL is not defined. Check config.js loading.");
}

// HANDLE AUTH ERRORS & STANDARD RESPONSES SECURELY
async function handleResponse(response) {
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "login.html";
    return null; // Stop further processing
  }

  if (!response.ok) {
    // const text = await response.text();
    // throw new Error(text || "Request failed");
    let errorMessage = "Request failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // Fallback if the backend response wasn't valid JSON
      errorMessage = await response.text() || errorMessage;
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses safely
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return null;
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

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const response = await fetch(`${API_URL}/orphans`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
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
