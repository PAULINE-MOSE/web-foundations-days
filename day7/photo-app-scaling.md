# Day 7 Assignment: Scaling a Photo-Sharing App

## 1. Assumptions

SnapShare is a photo-sharing application with 10 million registered users. The following assumptions are used for capacity planning:

* 10% of registered users are active daily.
* Each daily active user uploads one photo per day.
* Each daily active user views 50 feed pages per day.
* Each original photo is 2 MB.
* Each generated thumbnail is 50 KB.
* Peak feed traffic is five times the average feed-view rate.
* The calculations use 365 days per year and decimal storage units (1 TB = 1,000,000 MB).
* Each uploaded photo produces one thumbnail. Storage estimates exclude replication, backups, metadata, and temporary processing files.

## 2. Workload and Capacity Calculations

### Daily active users

Daily active users (DAU) are 10% of 10 million registered users.

10,000,000 × 0.10 = **1,000,000 daily active users**

### Photo uploads per second

Each daily active user uploads one photo per day.

* Uploads per day: 1,000,000 × 1 = **1,000,000 uploads**
* Average uploads per second: 1,000,000 ÷ 86,400 = **11.57 uploads per second**

### Feed views per second

Each daily active user views 50 feed pages per day.

* Feed views per day: 1,000,000 × 50 = **50,000,000 views**
* Average feed views per second: 50,000,000 ÷ 86,400 = **578.70 views per second**
* Peak feed views per second: 578.70 × 5 = **2,893.52, or approximately 2,894 views per second**

### Annual photo storage

**Original photos**

* Daily original-photo storage: 1,000,000 × 2 MB = 2,000,000 MB, or 2 TB
* Annual original-photo storage: 2 TB × 365 = **730 TB**

**Thumbnails**

* Daily thumbnail storage: 1,000,000 × 50 KB = 50,000,000 KB, or 50 GB
* Annual thumbnail storage: 50 GB × 365 = **18.25 TB**

**Total estimated annual storage**

730 TB + 18.25 TB = **748.25 TB per year**

This estimate covers one copy of the original photos and one copy of their thumbnails. Actual capacity requirements will be higher when backups, replication, metadata, and operational overhead are included.

## 3. Is SnapShare Read-Heavy or Write-Heavy?

SnapShare is a **read-heavy system** because it handles approximately 2,894 feed views per second at peak, compared with an average of 11.57 photo uploads per second. Feed requests greatly outnumber uploads, so the architecture should prioritize fast content delivery, caching, and scalable read capacity.

A content delivery network (CDN) can serve frequently requested images close to users. A cache can reduce repeated database queries, and a read replica can handle suitable read queries without sending every request to the primary database.

## 4. Why Store Photos in Object Storage Instead of the Database?

Original photos and thumbnails are binary files that are better suited to object storage than to a relational database. Object storage is designed to store large volumes of files and can scale independently of the application's structured data.

The relational database should store metadata such as the photo ID, uploader ID, object-storage key, upload status, creation time, and thumbnail key. This keeps database indexes more compact, reduces the amount of binary data included in database backups, and makes it easier to serve images through a CDN.

The database remains responsible for structured information and relationships, while object storage holds the actual image files.

## 5. System Architecture Diagram

```text
                          +------------------+
                          |       Users      |
                          +--------+---------+
                                   |
                                   v
                          +------------------+
                          |       CDN        |
                          | Cached images    |
                          +--------+---------+
                                   |
                                   v
                          +------------------+
                          |  Load Balancer   |
                          +--------+---------+
                                   |
                     +-------------+-------------+
                     |             |             |
                     v             v             v
                +---------+   +---------+   +---------+
                | App     |   | App     |   | App     |
                | Server  |   | Server  |   | Server  |
                +----+----+   +----+----+   +----+----+
                     |             |             |
                     +-------------+-------------+
                                   |
                 +-----------------+------------------+
                 |                 |                  |
                 v                 v                  v
          +-------------+   +-------------+   +----------------+
          | Cache       |   | Primary DB  |   | Object Storage |
          | Feed/data   |   | Metadata    |   | Original photos|
          +-------------+   +------+------+   | and thumbnails |
                                    |          +--------+-------+
                                    v                   ^
                            +---------------+           |
                            | Read Replica  |           |
                            | Read queries  |           |
                            +---------------+           |
                                                        |
Photo upload flow:                                      |
App Server --> Object Storage (original photo)          |
     |                                                  |
     v                                                  |
+----------------+       +----------------+             |
| Upload Queue   | ----> | Thumbnail      |-------------+
| Pending jobs   |       | Worker         |
+----------------+       +-------+--------+
                                 |
                                 v
                         +----------------+
                         | Primary DB     |
                         | Update photo   |
                         | status/keys    |
                         +----------------+
```

The application server coordinates uploads and records metadata, while object storage holds image files. The upload queue and background worker separate thumbnail generation from the initial upload request so that image processing can happen asynchronously.

## 6. Components and Their Responsibilities

* **CDN:** Delivers cached photos and thumbnails from locations closer to users, reducing latency and requests reaching the application servers.
* **Load balancer:** Distributes incoming application requests across healthy application-server instances.
* **Application servers:** Handle authentication, feed requests, upload authorization, metadata operations, and other application logic.
* **Cache:** Stores frequently requested feed data or metadata temporarily to reduce database load and improve response times.
* **Primary relational database:** Stores structured records such as users, photo metadata, object keys, and processing status.
* **Read replica:** Serves suitable read queries to reduce the read workload on the primary database, while acknowledging that replication may introduce a short delay.
* **Object storage:** Stores original photos and generated thumbnails independently of the relational database.
* **Upload queue:** Holds thumbnail-generation jobs until background workers can process them, allowing the system to absorb temporary bursts of uploads.
* **Thumbnail worker:** Consumes queued jobs, retrieves the original image, generates a smaller thumbnail, stores it in object storage, and updates the photo's processing status and thumbnail key in the database.

## 7. Step-by-Step Photo Upload Flow

1. **User initiates an upload:** The user selects a photo and sends an upload request to the application.
2. **Application validates the request:** The application checks authentication, authorization, file type, file size, and other upload rules.
3. **Create a pending photo record:** The application creates a photo record with a unique photo ID and a status such as `PENDING`. The record can also contain the uploader ID, creation time, and expected object-storage key.
4. **Store the original photo:** The original image is uploaded to object storage, either through the application server or directly using a short-lived, authorized upload URL. The application verifies that the upload completed successfully.
5. **Enqueue a processing job:** After confirming the original is stored, the application publishes a thumbnail-generation job containing the photo ID and object-storage key to the upload queue.
6. **Return an upload response:** The application can tell the user that the upload was received and is processing. The photo should not be presented as fully ready until the required image processing has completed.
7. **Worker consumes the job:** A thumbnail worker takes a job from the queue, retrieves the original image from object storage, and generates a thumbnail.
8. **Store the thumbnail and update metadata:** The worker saves the thumbnail to object storage and updates the database with its storage key and a status such as `READY`. The thumbnail should be stored successfully before the database marks it as ready.
9. **Make the image available:** The application can now return the original and thumbnail locations in feed responses. The CDN can cache the images for subsequent requests.
10. **Handle failures safely:** If processing fails, the job should be retried with limits and backoff. Repeated failures should be recorded for investigation, and a dead-letter queue can hold jobs that exceed the retry limit. Operations should be idempotent so that retries do not create duplicate records or inconsistent thumbnail states.

This sequence reduces the risk of displaying broken thumbnails or marking a photo as ready before its thumbnail exists. A cleanup process should identify abandoned pending records and unreferenced files so that failed uploads do not leave orphaned storage objects indefinitely.

## 8. System Trade-Offs

### Trade-off 1: CDN caching versus image freshness

**Benefit:** CDN caching reduces latency for users and lowers the number of requests reaching object storage and application infrastructure.

**Cost:** Cached content can become stale when an image changes or is removed. SnapShare can use versioned object keys or cache invalidation to manage updates, but these approaches introduce additional complexity.

### Trade-off 2: Asynchronous processing versus immediate availability

**Benefit:** A queue and background workers allow uploads to complete without making users wait for thumbnail generation. Worker capacity can also be scaled independently during busy periods.

**Cost:** Thumbnails may not be available immediately, and a large backlog can delay processing. SnapShare should monitor queue depth and job age, scale workers when needed, retry transient failures, and use dead-letter handling for jobs that repeatedly fail.

### Trade-off 3: Read replicas versus strongly current data

**Benefit:** Read replicas help distribute the large volume of feed and metadata reads without overloading the primary database.

**Cost:** Replication lag can cause a recently uploaded photo or its updated status to be temporarily missing from replica-backed queries. The application can read critical post-upload status from the primary database or otherwise account for eventual consistency.

### Trade-off 4: Redundant storage versus cost

**Benefit:** Replication and backups improve durability and help recover from failures or accidental deletion.

**Cost:** They increase storage expenses beyond the estimated 748.25 TB of annual new image content. SnapShare should define retention, backup, and recovery policies based on reliability requirements and budget.

## 9. Conclusion

SnapShare should use a read-optimized architecture with a CDN, cache, load-balanced application servers, a relational database with a read replica, and object storage for images. The upload queue and thumbnail worker allow image processing to happen asynchronously and scale independently.

Based on the stated assumptions, the system serves approximately one million daily active users, receives 11.57 uploads per second on average, and must accommodate about 2,894 peak feed views per second. It generates approximately 748.25 TB of new original-photo and thumbnail content annually before replication, backups, and overhead. Monitoring traffic, storage growth, queue delays, database load, and failure rates will help the architecture scale as SnapShare grows.
