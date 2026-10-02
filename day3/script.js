// Starting notes data
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];


// 1. Search notes
function searchNotes(word) {
  const searchWord = word.toLowerCase();

  return notes.filter((note) =>
    note.text.toLowerCase().includes(searchWord)
  );
}

// Test searchNotes - normal case
console.log(searchNotes("day"));
// Expected: [{ id: 2, text: "Finish the Day 3 assignment", category: "study" }]

// Test searchNotes - no results
console.log(searchNotes("python"));
// Expected: []


// 2. Find the longest note
function longestNote() {
  if (notes.length === 0) {
    return null;
  }

  let longest = notes[0];

  for (let i = 1; i < notes.length; i++) {
    if (notes[i].text.length > longest.text.length) {
      longest = notes[i];
    }
  }

  return longest;
}

// Test longestNote - normal case
console.log(longestNote());
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

// Test longestNote - empty array
const originalNotes = notes;
notes = [];

console.log(longestNote());
// Expected: null

notes = originalNotes;


// 3. Count notes by category
function countByCategory() {
  const counts = {};

  for (const note of notes) {
    if (!counts[note.category]) {
      counts[note.category] = 0;
    }

    counts[note.category]++;
  }

  return counts;
}

// Test countByCategory - normal case
console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }

// Test countByCategory - empty array
const savedNotesForCount = notes;
notes = [];

console.log(countByCategory());
// Expected: {}

notes = savedNotesForCount;


// 4. Get notes summary
function getSummary() {
  const counts = countByCategory();
  const total = notes.length;

  const noteWord = total === 1 ? "note" : "notes";

  return `${total} ${noteWord}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study.`;
}

// Test getSummary - normal case
console.log(getSummary());
// Expected: "5 notes: 2 personal, 1 work, 2 study."

// Test getSummary - empty array
const savedNotesForSummary = notes;
notes = [];

console.log(getSummary());
// Expected: "0 notes: 0 personal, 0 work, 0 study."

notes = savedNotesForSummary;


// 5. Check for duplicate notes
function isDuplicate(text) {
  const normalizedText = text.trim().toLowerCase();

  return notes.some(
    (note) => note.text.trim().toLowerCase() === normalizedText
  );
}

// Test isDuplicate - duplicate with different case and spaces
console.log(isDuplicate("  BUY MILK AND BREAD  "));
// Expected: true

// Test isDuplicate - text does not exist
console.log(isDuplicate("Buy eggs"));
// Expected: false


// 6. Add a note
function addNote(text, category) {
  const trimmedText = text.trim();
  const validCategories = ["personal", "work", "study"];

  if (trimmedText.length < 1 || trimmedText.length > 200) {
    console.log("Note must be between 1 and 200 characters.");
    return false;
  }

  if (isDuplicate(trimmedText)) {
    console.log("Note is a duplicate.");
    return false;
  }

  if (!validCategories.includes(category)) {
    console.log("Invalid category.");
    return false;
  }

  const newId =
    notes.length > 0
      ? Math.max(...notes.map((note) => note.id)) + 1
      : 1;

  notes.push({
    id: newId,
    text: trimmedText,
    category: category,
  });

  return true;
}

// Test addNote - normal case
console.log(addNote("Prepare presentation slides", "work"));
// Expected: true

// Test addNote - duplicate
console.log(addNote("  PREPARE PRESENTATION SLIDES  ", "work"));
// Expected: "Note is a duplicate." then false

// Test addNote - invalid category
console.log(addNote("Learn CSS Grid", "coding"));
// Expected: "Invalid category." then false

// Test addNote - empty text
console.log(addNote("   ", "study"));
// Expected: "Note must be between 1 and 200 characters." then false

// Test addNote - text over 200 characters
console.log(addNote("a".repeat(201), "personal"));
// Expected: "Note must be between 1 and 200 characters." then false