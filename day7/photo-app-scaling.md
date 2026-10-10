# Day 7 Assignment: Scaling a Photo-Sharing App (SnapShare)

## 1. Assumptions

SnapShare is a photo-sharing app where users upload photos and scroll a feed of photos from people they follow.

* 10,000,000 registered users.
* 10% of registered users are active each day.
* Each active user uploads 1 photo per day.
* Each active user views 50 feed pages per day.
* Each original photo is 2 MB.
* Each photo also gets a 50 KB thumbnail.
* Peak feed traffic is 5x the average feed-view rate.
* There are 86,400 seconds in a day and 365 days in a year.
* Storage uses decimal units (1 TB = 1,000,000 MB = 1,000 GB).
* Storage estimates exclude replication, backups, metadata and temporary files.

**Daily active users (DAU):**

10,000,000 x 0.10 = **1,000,000 daily active users**

## 2. Estimates

### Uploads per second

* Uploads per day: 1,000,000 x 1 = 1,000,000
* Average uploads per second: 1,000,000 / 86,400 = **about 11.57 uploads/second**

### Feed views per second

* Feed views per day: 1,000,000 x 50 = 50,000,000
* Average feed views per second: 50,000,000 / 86,400 = **about 578.70 views/second**
* Peak feed views per second: 578.70 x 5 = **about 2,894 views/second**

### Photo storage per year

* Originals per day: 1,000,000 x 2 MB = 2,000,000 MB = 2 TB
* Originals per year: 2 TB x 365 = **730 TB**
* Thumbnails per day: 1,000,000 x 50 KB = 50,000,000 KB = 50 GB
* Thumbnails per year: 50 GB x 365 = **18.25 TB**
* **Total: 730 TB + 18.25 TB = 748.25 TB per year**

## 3. Read-Heavy or Write-Heavy?

SnapShare is **read-heavy**. At peak it serves about 2,894 feed views per second but receives only about 11.57 uploads per second on average, so reads outnumber writes by roughly 250 to 1 (about 50 feed views for every 1 upload).

**What this means for the design:**

* Put a CDN in front of the images so most image requests never reach our servers.
* Add a cache for feed data so the database is not queried for every view.
* Use a read replica so most database reads do not hit the primary database.
* Keep the write path simple and push slow work (thumbnails) to a background queue.

## 4. Why Photos Should Not Be Stored in the Database

Photos are large binary files, and storing them inside the database would bloat tables and backups (748 TB of new images a year), slow queries and make the database the bottleneck. Databases are built for small structured records, not for serving large files.

Photos should go in **object storage** (for example, Amazon S3), which is cheap, scales almost without limit and works well with a CDN. The database stores only **metadata**: photo ID, uploader ID, object-storage key, thumbnail key, status and creation time.

## 5. Architecture Diagram

```text
                      +----------------+
                      |     Users      |
                      +-------+--------+
                              |
                              v
                      +----------------+
                      |      CDN       |  (cached photos and thumbnails)
                      +-------+--------+
                              |
                              v
                      +----------------+
                      | Load Balancer  |
                      +-------+--------+
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
        +-----------+   +-----------+   +-----------+
        | App Server|   | App Server|   | App Server|
        +-----+-----+   +-----+-----+   +-----+-----+
              |               |               |
              +---------------+---------------+
                              |
        +---------------------+----------------------+
        |                     |                      |
        v                     v                      v
 +-------------+      +---------------+      +----------------+
 |   Cache     |      | Primary DB    |      | Object Storage |
 | (feed data) |      | (metadata,    |      | (original      |
 +-------------+      |  writes)      |      |  photos and    |
                      +-------+-------+      |  thumbnails)   |
                              |              +--------+-------+
                              | replication           ^
                              v                       |
                      +---------------+               |
                      | Read Replica  |               |
                      | (feed reads)  |               |
                      +---------------+               |
                                                      |
        App Server --(job: photo ID + key)--+         |
                                            v         |
                                    +--------------+  |
                                    | Upload Queue |  |
                                    +------+-------+  |
                                           |          |
                                           v          |
                                    +--------------+  |
                                    |  Thumbnail   |--+  (reads original,
                                    |   Worker     |      saves thumbnail)
                                    +------+-------+
                                           |
                                           v
                                    Primary DB: mark photo READY
```

## 6. Components (One Sentence Each)

* **CDN:** Solves slow image loading by serving cached photos and thumbnails from locations close to the user, which also keeps most image traffic off our servers.
* **Load balancer:** Solves the problem of one server being overloaded by spreading incoming requests across all healthy app servers.
* **App servers:** Solve the need for application logic by handling login, uploads, feed requests and metadata, and they can be scaled out by adding more copies.
* **Cache:** Solves repeated database work by keeping frequently requested feed data in fast memory so popular requests are answered quickly.
* **Primary database:** Solves the need for reliable structured storage by holding users, follows and photo metadata, and it handles all writes.
* **Read replica:** Solves read overload on the primary database by serving feed read queries from a copy of the data.
* **Object storage:** Solves the problem of storing huge numbers of large files cheaply by holding original photos and thumbnails outside the database.
* **Queue:** Solves upload bursts and slow processing by holding thumbnail jobs until a worker is free, so users never wait for thumbnails.
* **Thumbnail worker:** Solves the cost of image resizing by picking up queued jobs in the background, creating the 50 KB thumbnail and saving it to object storage.

## 7. Upload Flow (Step by Step)

1. **User uploads a photo.** The user picks a photo in the app and sends an upload request.
2. **Load balancer routes it.** The request goes through the load balancer to one app server.
3. **App server validates it.** It checks that the user is logged in and that the file type and size are allowed.
4. **Create a pending record.** The app server creates a photo record in the primary database with a unique photo ID and status `PENDING`.
5. **Save the original.** The 2 MB original is stored in object storage, and the app server confirms the upload succeeded.
6. **Queue the thumbnail job.** The app server adds a job (photo ID and object-storage key) to the upload queue.
7. **Respond to the user.** The app tells the user the photo was received and is processing, so the user does not wait for the thumbnail.
8. **Worker takes the job.** A thumbnail worker pulls the job from the queue and reads the original from object storage.
9. **Create and save the thumbnail.** The worker generates the 50 KB thumbnail and saves it to object storage.
10. **Update the database.** The worker stores the thumbnail key and changes the status to `READY` in the primary database, only after the thumbnail was saved.
11. **Photo appears in feeds.** Followers' feeds can now show the photo, and the CDN caches the images for later views.
12. **Handle failures.** If a job fails, it is retried a limited number of times; jobs that keep failing go to a dead-letter queue for investigation, and the worker is idempotent so retries do not create duplicates.

## 8. Trade-Offs

### Trade-off 1: CDN caching vs. fresh content

* **Benefit:** Faster image loading and far less load on our servers and storage.
* **Cost:** Cached copies can go stale. If a photo is deleted or replaced, users may still see the old version until the cache expires or is invalidated. Using versioned file names or cache invalidation helps but adds complexity.

### Trade-off 2: Asynchronous thumbnails vs. instant availability

* **Benefit:** Uploads finish quickly, and workers can be scaled separately during busy periods.
* **Cost:** A thumbnail is not ready the instant the upload completes, and a backed-up queue delays processing. We must monitor queue length, retry failures and use a dead-letter queue.

### Trade-off 3: Read replica vs. up-to-date data

* **Benefit:** Spreads the heavy read traffic and protects the primary database.
* **Cost:** Replication lag means a replica may briefly miss a brand-new photo or status change. Critical reads right after an upload can go to the primary database.

### Trade-off 4: Redundant storage vs. cost

* **Benefit:** Replication and backups protect photos from hardware failure or accidental deletion.
* **Cost:** They multiply the 748.25 TB per year of new content, so retention and backup policies must balance reliability against budget.

## 9. Conclusion

SnapShare is a read-heavy system with about 1 million daily active users, about 11.57 uploads per second on average and about 2,894 feed views per second at peak. It adds about 748.25 TB of new photo content each year before replication and backups. A CDN, cache, load-balanced app servers, a database with a read replica, object storage and a queue with thumbnail workers let the system scale reads cheaply while keeping uploads fast.