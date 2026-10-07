let users = [];

const loadButton = document.getElementById("load-users");
const filterInput = document.getElementById("filter-input");
const status = document.getElementById("status");
const usersList = document.getElementById("users-list");

async function loadUsers() {
  loadButton.disabled = true;
  status.textContent = "Loading users...";
  usersList.innerHTML = "";

  try {
    const response = await fetch(
      "https://jsonplaceholder.typicode.com/users"
    );

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    users = await response.json();

    renderUsers(users);

    status.textContent = `${users.length} users loaded successfully.`;
  } catch (error) {
    users = [];
    status.textContent = "Failed to load users. Please try again.";
    console.error("Error loading users:", error);
  } finally {
    loadButton.disabled = false;
  }
}

function renderUsers(userArray) {
  usersList.innerHTML = "";

  if (userArray.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.textContent = "No users found.";
    usersList.appendChild(emptyMessage);
    return;
  }

  userArray.forEach((user) => {
    const listItem = document.createElement("li");

    const name = document.createElement("strong");
    name.textContent = user.name;

    const email = document.createElement("p");
    email.textContent = `Email: ${user.email}`;

    const city = document.createElement("p");
    city.textContent = `City: ${user.address.city}`;

    const company = document.createElement("p");
    company.textContent = `Company: ${user.company.name}`;

    listItem.appendChild(name);
    listItem.appendChild(email);
    listItem.appendChild(city);
    listItem.appendChild(company);

    usersList.appendChild(listItem);
  });
}

function filterUsers() {
  const searchTerm = filterInput.value.trim().toLowerCase();

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm)
  );

  renderUsers(filteredUsers);

  if (searchTerm === "") {
    status.textContent = `${users.length} users loaded successfully.`;
  } else {
    status.textContent = `${filteredUsers.length} user(s) found.`;
  }
}

loadButton.addEventListener("click", loadUsers);

filterInput.addEventListener("input", filterUsers);