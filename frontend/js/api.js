const API_URL = "http://localhost:5000/api"; // change if deployed

// LOGIN FUNCTION
async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  return response.json();
}

// CREATE ORPHAN
// async function createOrphan(data) {
//   const token = localStorage.getItem("token");

//   const response = await fetch(`${API_URL}/orphans`, {
//     method: "POST",
//     headers: { 
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`
//     },
//     body: JSON.stringify(data)
//   });

//   return response.json();
// }
async function createOrphan(formData) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/orphans`, {
    method: "POST",
    headers: { 
      Authorization: `Bearer ${token}` // ❗ NO content-type for files
    },
    body: formData 
  });

  return response.json();
}


// GET ORPHANS
async function getOrphans() {
  const response = await fetch(`${API_URL}/orphans`);
  return response.json();
}

// GET WIDOWS
async function getWidows() {
  const response = await fetch(`${API_URL}/widows`);
  return response.json();
}