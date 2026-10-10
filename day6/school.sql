-- ============================================
-- DAY 6: SCHOOL DATABASE
-- ============================================

PRAGMA foreign_keys = ON;

-- Students table
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- Courses table
CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY,
    course_name TEXT NOT NULL
);

-- Enrolments table
CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),

    -- Prevent the same student from enrolling
    -- in the same course more than once.
    UNIQUE (student_id, course_id)
);

-- ============================================
-- SAMPLE DATA
-- ============================================

INSERT INTO students (student_id, name, email)
VALUES
    (1, 'Alice Mwangi', 'alice@example.com'),
    (2, 'Brian Otieno', 'brian@example.com'),
    (3, 'Carol Wanjiku', 'carol@example.com'),
    (4, 'David Kamau', 'david@example.com');

INSERT INTO courses (course_id, course_name)
VALUES
    (1, 'Mathematics'),
    (2, 'Computer Science'),
    (3, 'Database Systems');

INSERT INTO enrolments (enrolment_id, student_id, course_id, grade)
VALUES
    (1, 1, 1, 'A'),
    (2, 1, 2, 'B'),
    (3, 2, 1, 'B'),
    (4, 2, 3, 'A'),
    (5, 3, 2, 'A');

-- ============================================
-- QUERY 1: All courses for one student
-- ============================================

SELECT
    s.name AS student_name,
    c.course_name
FROM students AS s
JOIN enrolments AS e
    ON s.student_id = e.student_id
JOIN courses AS c
    ON e.course_id = c.course_id
WHERE s.name = 'Alice Mwangi';

-- ============================================
-- QUERY 2: All students on one course
-- ============================================

SELECT
    c.course_name,
    s.name AS student_name
FROM courses AS c
JOIN enrolments AS e
    ON c.course_id = e.course_id
JOIN students AS s
    ON e.student_id = s.student_id
WHERE c.course_name = 'Computer Science';

-- ============================================
-- QUERY 3: Number of students per course
-- ============================================

SELECT
    c.course_name,
    COUNT(e.student_id) AS student_count
FROM courses AS c
LEFT JOIN enrolments AS e
    ON c.course_id = e.course_id
GROUP BY c.course_id, c.course_name;

-- ============================================
-- QUERY 4: Students with no enrolments
-- ============================================

SELECT
    s.student_id,
    s.name,
    s.email
FROM students AS s
LEFT JOIN enrolments AS e
    ON s.student_id = e.student_id
WHERE e.student_id IS NULL;

-- ============================================
-- QUERY 5: Update one enrolment grade
-- ============================================

UPDATE enrolments
SET grade = 'A+'
WHERE enrolment_id = 3;

-- Verify the updated grade
SELECT *
FROM enrolments
WHERE enrolment_id = 3;