# School Database Design

## Students

The `students` table stores information about each student. Each student has a unique `student_id`, a name, and a unique email address.

## Courses

The `courses` table stores the courses offered by the school. Each course has a unique `course_id` and a course name.

## Enrolments

The `enrolments` table records which students are enrolled in which courses. It also stores the grade earned by the student. The table contains foreign keys linking each enrolment to a student and a course.

## Relationships

There is a one-to-many relationship between students and enrolments. One student can have many enrolments, while each enrolment belongs to one student.

There is also a one-to-many relationship between courses and enrolments. One course can have many enrolments, while each enrolment belongs to one course.

Students and courses have a many-to-many relationship because one student can take many courses and one course can have many students. The `enrolments` table is therefore needed as a join table to connect the two entities. It also provides a place to store information specific to the relationship, such as the student's grade.

## Index

I would add an index on `enrolments.student_id` because student-based queries frequently need to find all courses taken by a particular student. An index would make these lookups more efficient as the number of enrolments grows.

Example:

```sql
CREATE INDEX idx_enrolments_student_id
ON enrolments(student_id);