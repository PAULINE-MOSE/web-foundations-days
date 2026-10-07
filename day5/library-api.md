# Library API Design

This document describes a REST API for managing books in a library system.

The API uses JSON for request and response bodies.

## 1. List All Books

**Method:** GET

**Path:** `/books`

**Description:** Returns a list of all books in the library.

**Request Body:** None

**Success Status:** `200 OK`

**Example Response:**

```json
[
  {
    "id": 1,
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "year": 1958
  },
  {
    "id": 2,
    "title": "The River Between",
    "author": "Ngugi wa Thiong'o",
    "year": 1965
  }
]