// Select page elements
const noteText = document.querySelector("#note-text");
const charCount = document.querySelector("#char-count");
const wordCount = document.querySelector("#word-count");
const clearBtn = document.querySelector("#clear-btn");
const themeToggle = document.querySelector("#theme-toggle");

const DRAFT_KEY = "quicknotes-draft";
const THEME_KEY = "quicknotes-theme";
const MAX_CHARACTERS = 200;
const WARNING_LIMIT = 180;


// Count the number of words in a note
function countWords(text) {
  const trimmedText = text.trim();

  if (trimmedText === "") {
    return 0;
  }

  return trimmedText.split(/\s+/).length;
}


// Update character and word counters
function updateCounts(text) {
  const characterCount = text.length;
  const words = countWords(text);

  charCount.textContent = `${characterCount} / ${MAX_CHARACTERS} characters`;
  wordCount.textContent = `${words} words`;

  charCount.classList.remove("warning", "over");

  if (characterCount > MAX_CHARACTERS) {
    charCount.classList.add("over");
  } else if (characterCount > WARNING_LIMIT) {
    charCount.classList.add("warning");
  }
}


// Save the current note as a draft
function saveDraft(text) {
  localStorage.setItem(DRAFT_KEY, text);
}


// Clear the note and remove the saved draft
function clearNote() {
  noteText.value = "";
  updateCounts("");
  localStorage.removeItem(DRAFT_KEY);
}


// Apply the selected theme
function applyTheme(theme) {
  const isDark = theme === "dark";

  document.body.classList.toggle("dark", isDark);
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
}


// Save the selected theme
function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}


// Toggle between light and dark themes
function toggleTheme() {
  const isDark = document.body.classList.contains("dark");
  const newTheme = isDark ? "light" : "dark";

  applyTheme(newTheme);
  saveTheme(newTheme);
}


// Handle note input
noteText.addEventListener("input", () => {
  updateCounts(noteText.value);
  saveDraft(noteText.value);
});


// Clear button
clearBtn.addEventListener("click", () => {
  clearNote();
});


// Clear note when Escape is pressed inside the textarea
noteText.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    clearNote();
  }
});


// Theme button
themeToggle.addEventListener("click", () => {
  toggleTheme();
});


// Restore saved data when the page loads
const savedDraft = localStorage.getItem(DRAFT_KEY);
const savedTheme = localStorage.getItem(THEME_KEY);

if (savedDraft !== null) {
  noteText.value = savedDraft;
}

if (savedTheme === "dark") {
  applyTheme("dark");
} else {
  applyTheme("light");
}

updateCounts(noteText.value);