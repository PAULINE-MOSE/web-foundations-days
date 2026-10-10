# School Database Design

## Students

The `students` table stores information about each student. Each student has a unique `student_id`, a name, and a unique email address.

## Courses

The `courses` table stores the courses offered by the school. Each course has a unique `course_id` and a course name.

## Enrolments

The `enrolments` table records which students are enrolled in which courses. It also stores the grade earned by the student. The table contains foreign keys linking each enrolment to a student and a course.

A composite `UNIQUE` constraint on `student_id` and `course_id` prevents the same student from enrolling in the same course more than once.

## Relationships

There is a one-to-many relationship between students and enrolments. One student can have many enrolments, while each enrolment belongs to one student.

There is also a one-to-many relationship between courses and enrolments. One course can have many enrolments, while each enrolment belongs to one course.

Students and courses have a many-to-many relationship because one student can take many courses and one course can have many students. The `enrolments` table is therefore needed as a join table to connect the two entities.

The `enrolments` table also provides a place to store information specific to the relationship, such as the student's grade.

## Index

I would add an index on `enrolments.student_id` because student-based queries frequently need to find all courses taken by a particular student. An index would make these lookups more efficient as the number of enrolments grows.

Example:

```sql
CREATE INDEX idx_enrolments_student_id
ON enrolments(student_id);
## SQL or NoSQL?

I would choose a relational SQL database for this school system rather than a NoSQL document database. Student records, courses, and enrolments have clearly defined relationships and structured data, making a relational database a good fit. SQL databases support primary keys, foreign keys, unique constraints, and transactions, which help maintain data integrity and prevent duplicate enrolments or invalid student and course references. The many-to-many relationship between students and courses is naturally represented using the enrolments join table. Although NoSQL databases offer flexible schemas and can be useful for unstructured or rapidly changing data, this school system benefits more from SQL's consistency, relationships, and querying capabilities.
