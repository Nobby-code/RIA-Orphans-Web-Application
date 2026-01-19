// const API_URL = "http://localhost:5000/api"; 

const API_URL = window.API_BASE_URL;

async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.token) {
        localStorage.setItem("token", data.token); 
        alert("Login successful");
        window.location.href = "create-orphan.html";
    } else {
        alert("Invalid credentials");
    }
}
