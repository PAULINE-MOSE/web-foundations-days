# Library API Design

This document describes a REST API for managing books in a library system.

The API uses JSON for request and response bodies.

## 1. List All Books

**Method:** GET

**Path:** `/books`

**Description:** Returns a list of all books in the library.

**Request Body:** None

**Success Status:** 200 OK

**Example:** `GET /books`

---

## 2. Get One Book by ID

**Method:** GET

**Path:** `/books/:id`

**Description:** Returns one specific book using its unique ID.

**Request Body:** None

**Success Status:** 200 OK

**Example:** `GET /books/1`

**Example Response:**

`{"id":1,"title":"Things Fall Apart","author":"Chinua Achebe","year":1958}`

---

## 3. Create a New Book

**Method:** POST

**Path:** `/books`

**Description:** Creates a new book in the library.

**Request Body:**

`{"title":"Petals of Blood","author":"Ngugi wa Thiong'o","year":1977}`

**Success Status:** 201 Created

**Example:** `POST /books`

---

## 4. Update an Existing Book

**Method:** PUT

**Path:** `/books/:id`

**Description:** Updates an existing book using its unique ID.

**Request Body:**

`{"title":"Petals of Blood","author":"Ngugi wa Thiong'o","year":1977}`

**Success Status:** 200 OK

**Example:** `PUT /books/3`

---

## 5. Delete a Book

**Method:** DELETE

**Path:** `/books/:id`

**Description:** Deletes a book from the library using its unique ID.

**Request Body:** None

**Success Status:** 204 No Content

**Example:** `DELETE /books/3`

---

## 6. List Books by Author

**Method:** GET

**Path:** `/books?author={author}`

**Description:** Returns books written by a specific author using the author query parameter.

**Request Body:** None

**Success Status:** 200 OK

**Example:** `GET /books?author=Chinua%20Achebe`

**Example Response:**

`[{"id":1,"title":"Things Fall Apart","author":"Chinua Achebe","year":1958}]`

---

# Error Responses

## 400 Bad Request

**Description:** The server returns 400 Bad Request when the client sends invalid or incomplete data.

**Example scenario:** A client tries to create a book without providing a title.

**Request:**

`POST /books`

**Request Body:**

`{"author":"Chinua Achebe","year":1958}`

**Response:**

`{"error":"Title is required."}`

**Status:** 400 Bad Request

---

## 404 Not Found

**Description:** The server returns 404 Not Found when the requested book does not exist.

**Example scenario:** A client requests a book with an ID that does not exist.

**Request:**

`GET /books/999`

**Response:**

`{"error":"Book not found."}`

**Status:** 404 Not Found

---

# API Summary

| Operation | Method | Path | Success Status |
|---|---|---|---|
| List all books | GET | `/books` | 200 OK |
| Get one book | GET | `/books/:id` | 200 OK |
| Create a book | POST | `/books` | 201 Created |
| Update a book | PUT | `/books/:id` | 200 OK |
| Delete a book | DELETE | `/books/:id` | 204 No Content |
| List by author | GET | `/books?author={author}` | 200 OK |
