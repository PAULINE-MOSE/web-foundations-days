const loadUsersButton = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const status = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

let users = [];

// Render users to the page
function renderUsers(list) {
  usersList.textContent = "";

  if (list.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.textContent = "No users match your filter.";
    usersList.appendChild(emptyMessage);
    return;
  }

  list.forEach((user) => {
    const listItem = document.createElement("li");

    const name = document.createElement("h3");
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

// Load users from the API
async function loadUsers() {
  loadUsersButton.disabled = true;
  status.textContent = "Loading users...";

  try {
    const response = await fetch(
      "https://jsonplaceholder.typicode.com/users"
    );

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    users = await response.json();

    renderUsers(users);

    status.textContent = `Successfully loaded ${users.length} users.`;
  } catch (error) {
    users = [];
    usersList.textContent = "";

    status.textContent =
      "Unable to load users. Please try again later.";

    console.error("Error loading users:", error);
  } finally {
    loadUsersButton.disabled = false;
  }
}

// Load users when the button is clicked
loadUsersButton.addEventListener("click", loadUsers);

// Filter users without making another API request
filterInput.addEventListener("input", () => {
  const searchText = filterInput.value.trim().toLowerCase();

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchText)
  );

  renderUsers(filteredUsers);

  if (searchText !== "" && filteredUsers.length === 0) {
    status.textContent = "No users match your filter.";
  } else if (searchText === "" && users.length > 0) {
    status.textContent = `Successfully loaded ${users.length} users.`;
  }
});