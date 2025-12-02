const API_URL = "http://localhost:5000/api"; // change if deployed

async function createOrphan() {
    const token = localStorage.getItem("token");

    const orphan = {
        name: document.getElementById("name").value,
        type: document.getElementById("type").value,
        description: document.getElementById("description").value,
        photo: document.getElementById("photo").value
    };

    const res = await fetch("http://localhost:5000/api/orphans", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(orphan)
    });

    const data = await res.json();

    if (data.success) {
        alert("Orphan created!");
    } else {
        alert("Error creating orphan");
    }
}

async function loadOrphans() {
    const res = await fetch("http://localhost:5000/api/orphans");
    const data = await res.json();

    const container = document.getElementById("orphans-container");
    container.innerHTML = "";

    data.forEach(o => {
        container.innerHTML += `
        <div class="col-lg-3 col-md-6">
            <div class="card shadow text-center border-0 member-card">
                <img src="${o.photo}" class="card-img-top" />
                <div class="card-body">
                    <h5 class="fw-bold">${o.name}</h5>
                    <small class="text-muted">${o.type}</small>
                    <p class="mt-2 small">${o.description}</p>
                    <a href="donation-form.html" class="btn btn-primary btn-sm mt-2">Donate</a>
                </div>
            </div>
        </div>
        `;
    });
}
