# SnapShare: Scaling Plan

## 1. Assumptions

SnapShare is a photo-sharing application where users upload photos and view a feed containing photos from people they follow.

The design uses the following assumptions:

* There are 10 million registered users.
* 10% of registered users are active each day.
* Each daily active user uploads one photo per day.
* Each daily active user views 50 feed pages per day.
* Each original photo averages 2 MB.
* Each photo generates one thumbnail of 50 KB.
* A day contains 86,400 seconds, and a year contains 365 days.
* Traffic is not evenly distributed throughout the day. Peak feed traffic is estimated at five times the average rate.
* Storage calculations use decimal units: 1 TB = 1,000 GB and 1 GB = 1,000 MB.

These estimates represent the baseline workload. Additional capacity is required for traffic spikes, retries, replication, backups, and future growth.

## 2. Workload Calculations

### Daily active users

Daily active users (DAU) are calculated as:

10,000,000 registered users × 10% = **1,000,000 daily active users**.

### Photo uploads per day and per second

Each daily active user uploads one photo per day.

Daily uploads = 1,000,000 × 1 = **1,000,000 uploads per day**.

Average uploads per second = 1,000,000 ÷ 86,400 = **approximately 11.57 uploads per second**.

### Feed views per day and per second

Each daily active user views 50 feed pages per day.

Daily feed views = 1,000,000 × 50 = **50,000,000 feed views per day**.

Average feed views per second = 50,000,000 ÷ 86,400 = **approximately 578.70 feed views per second**.

Peak feed views per second = 578.70 × 5 = **approximately 2,893.52 feed views per second**, or about 2,894.

These are feed-page requests, not individual photo downloads. A single feed page may display several photos, so the actual number of image requests can be much higher.

### Annual photo storage

Each uploaded photo produces an original image of 2 MB and a thumbnail of 50 KB.

**Original photos:**

1,000,000 uploads per day × 365 days = 365,000,000 photos per year.

365,000,000 × 2 MB = 730,000,000 MB = **730 TB per year**.

**Thumbnails:**

365,000,000 × 50 KB = 18,250,000,000 KB = **18.25 TB per year**.

**Total new image storage:**

730 TB + 18.25 TB = **748.25 TB per year**.

This is the estimated annual storage for original photos and thumbnails alone. It excludes backups, replicated copies, metadata, and other overhead. SnapShare should monitor storage growth and establish retention and backup policies.

## 3. Read-Heavy or Write-Heavy?

SnapShare is a **read-heavy system**. Each active user uploads one photo but views 50 feed pages per day, producing approximately 50 feed views for every upload.

The system should therefore be designed to serve many feed requests quickly. A CDN can deliver frequently accessed images close to users, a cache can reduce repeated database queries, and a database read replica can handle read traffic without placing all the load on the primary database. The upload path must still be reliable and scalable, but feed delivery is likely to be the larger request workload.

## 4. Where Should Photos Be Stored?

Photo files should be stored in **object storage**, not directly inside the relational database. Original images and thumbnails are large binary files, and storing them in the database would increase database size, backup time, and the cost of serving image traffic.

The database should store metadata such as the photo ID, uploader ID, caption, upload time, visibility settings, and object-storage keys or URLs. The actual image files should live in object storage, where they can be stored durably and delivered through a CDN. This separates image delivery from database operations and allows both systems to scale independently.

## 5. Architecture Diagram

```text
                       +------------------+
                       |      Users       |
                       +--------+---------+
                                |
                                v
                       +------------------+
                       |       CDN        |
                       | Cached image     |
                       | delivery         |
                       +--------+---------+
                                |
                                | API requests
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
                 +--------------+---------------+
                 |              |               |
                 v              v               v
           +-----------+  +-----------+   +----------------+
           |   Cache   |  | Primary   |   | Object Storage |
           | Feed data |  | Database  |   | Originals and  |
           | Metadata  |  +-----+-----+   | thumbnails     |
           +-----------+        |         +--------+-------+
                                |                  ^
                                v                  |
                         +-------------+           |
                         | Read Replica|           |
                         +-------------+           |
                                                   |
                         +----------------+        |
                         | Upload Queue   |        |
                         +-------+--------+        |
                                 |                 |
                                 v                 |
                         +----------------+        |
                         | Thumbnail      |--------+
                         | Worker         |
                         +----------------+
```

## 6. What Each Component Solves

* **CDN:** Delivers cached photos and thumbnails from locations closer to users, reducing latency and origin-server bandwidth.
* **Load balancer:** Distributes incoming API requests across healthy application servers to prevent one server from becoming overloaded.
* **Application servers:** Handle authentication, upload authorization, feed generation, validation, and other business logic.
* **Cache:** Stores frequently requested feed data and metadata to reduce repeated database queries and improve response times.
* **Primary database:** Stores authoritative user, photo, follow-relationship, and other application metadata while handling writes.
* **Database read replica:** Serves eligible read queries to reduce pressure on the primary database and increase read capacity.
* **Object storage:** Stores original photos and generated thumbnails durably without placing large image files inside the database.
* **Upload queue:** Holds thumbnail-generation jobs so photo uploads do not need to wait for image processing to finish.
* **Thumbnail worker:** Processes queued jobs, resizes uploaded originals, and saves the resulting thumbnails to object storage.

## 7. Photo Upload Flow

1. A user selects a photo and submits it through the SnapShare application.
2. The application server authenticates the user and validates the file type, file size, and upload permissions.
3. The original photo is uploaded to object storage, either through the application server or through a time-limited, authorized upload URL.
4. The application records the photo's metadata and storage key in the primary database. The photo can be marked as processing until its thumbnail is ready.
5. The application publishes a thumbnail-generation job to the upload queue, including the photo ID and original storage key.
6. The application confirms that the original photo was accepted and indicates whether processing is still underway.
7. A thumbnail worker retrieves the job, downloads or reads the original from object storage, and generates a smaller thumbnail.
8. The worker saves the thumbnail to object storage and updates the photo's processing status in the database.
9. The feed can display the photo and thumbnail using their authorized URLs. The CDN caches eligible image responses to accelerate future views.

The queue makes thumbnail processing asynchronous, so a slow image-processing task does not have to delay the initial upload response. Jobs should be retried safely when temporary failures occur, and repeated jobs should not create duplicate or inconsistent results.

## 8. Trade-Offs

### Trade-off 1: CDN caching versus freshness

Caching photos and thumbnails through a CDN improves response times and reduces load on object storage. However, cached content may not immediately reflect a replacement or deletion. SnapShare can use versioned object keys, cache-control policies, and cache invalidation where necessary, balancing freshness against performance and cost.

### Trade-off 2: Database read replicas versus consistency

Read replicas increase read capacity and help protect the primary database from heavy feed traffic. However, replication may lag behind recent writes, so a newly uploaded photo might not appear immediately in a feed query routed to a replica. The application can temporarily read from the primary database when a user needs to see their own latest changes.

### Trade-off 3: Asynchronous thumbnails versus immediate availability

Using a queue and workers makes uploads more responsive and allows thumbnail processing capacity to scale independently. However, thumbnails are not available immediately, and queue backlogs or worker failures can delay processing. Monitoring queue depth, retrying failed jobs, and showing a processing status can help manage this delay.

### Trade-off 4: More infrastructure versus operational cost

Separating application servers, caches, read replicas, object storage, and workers allows each component to scale according to demand. However, this architecture introduces additional infrastructure costs and operational complexity. SnapShare should monitor utilization, automate deployment and recovery, and scale components according to measured demand.

## 9. Conclusion

SnapShare should use a horizontally scalable application tier, a primary database with a read replica, caching, a CDN, object storage, and asynchronous thumbnail processing. With one million daily active users, the estimated average load is about 11.57 uploads and 578.70 feed views per second, with peak feed traffic approaching 2,894 views per second. The system generates approximately 748.25 TB of original-photo and thumbnail storage per year before overhead. This design prioritizes fast feed delivery while keeping image storage and thumbnail processing independent from core database operations.
