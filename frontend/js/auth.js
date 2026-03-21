// const API_URL = "http://localhost:5000/api";

const API_URL = window.API_BASE_URL;

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

//   const res = await fetch(`${API_URL}/auth/login`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ email, password }),
//   });

//   const data = await res.json();

//   if (res.ok && data.token) {
//     localStorage.setItem("token", data.token);

//     if (data.role) {
//       localStorage.setItem("role", data.role);
//     }

//     alert(data.message || "Login successful");
//     window.location.href = "create-orphan.html";

//   } else {
//     alert("Invalid credentials");
//   } 
// }


try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok && data.token) {
      // Save token
      localStorage.setItem("token", data.token);

      // optional: save role if backend returns it
      if (data.role) {
        localStorage.setItem("role", data.role);
      }

      alert("Login successful");

      // redirect after login
      window.location.href = "create-orphan.html";
    } else {
      alert(data.message || "Invalid credentials");
    }

  } catch (error) {
    console.error("Login error:", error);
    alert("Server error. Please try again.");
  }
}