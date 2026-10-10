# Day 7: SnapShare Scaling Plan

## 1. Assumptions
- 10,000,000 registered users; 10% active daily
- Each active user uploads 1 photo/day and views 50 feed pages/day
- Photo = 2 MB, thumbnail = 50 KB; peak traffic = 5x average
- 86,400 seconds/day, 365 days/year, 1 TB = 1,000,000 MB
- Excludes replication and backups
- **DAU = 10,000,000 x 0.10 = 1,000,000**

## 2. Estimates
- **Uploads/sec:** 1,000,000 / 86,400 = **11.57/s**
- **Feed views/sec:** 50,000,000 / 86,400 = **578.7/s average**; peak 578.7 x 5 = **2,894/s**
- **Storage/year:** originals 2 TB/day x 365 = 730 TB; thumbnails 50 GB/day x 365 = 18.25 TB; **total = 748.25 TB/year**

## 3. Read-heavy or write-heavy?
**Read-heavy**: about 2,894 peak reads/s versus 11.57 uploads/s (about 50 views per upload). So the design uses a CDN, cache and read replica to absorb reads, and a queue to keep writes fast.

## 4. Why photos do not go in the database
Photos are large binary files; storing them in the database bloats it and slows queries and backups. They go in **object storage**; the database keeps only metadata (photo ID, user ID, storage key, status).

## 5. Architecture diagram
```text
Users --> CDN --> Load Balancer --> App Servers (x3)
                                        |
      +-----------+---------------------+------------+
      |           |                     |            |
   [Cache]   [Primary DB]        [Object Storage]  [Queue]
                  |                     ^            |
                  v                     |            v
            [Read Replica]              +-----[Thumbnail Worker]
                  ^                                  |
                  +----- status = READY -------------+
```

## 6. Components (one sentence each)
- **CDN:** stops slow image loads by serving cached photos from servers near the user.
- **Load balancer:** stops any one server being overloaded by spreading requests across app servers.
- **App servers:** run the app logic (login, upload, feed) and scale by adding more copies.
- **Cache:** avoids repeated database work by keeping popular feed data in fast memory.
- **Primary database:** safely stores users, follows and photo metadata and handles all writes.
- **Read replica:** relieves the primary database by answering feed read queries from a copy.
- **Object storage:** cheaply stores huge numbers of large photo files outside the database.
- **Queue:** holds thumbnail jobs so uploads never wait for image processing.
- **Thumbnail worker:** resizes photos in the background and saves the 50 KB thumbnail.

## 7. Upload flow
1. User sends the photo; the load balancer routes it to an app server.
2. App server checks login, file type and size.
3. App server creates a database record with status `PENDING`.
4. App server saves the 2 MB original in object storage.
5. App server adds a job (photo ID + storage key) to the queue and replies "processing".
6. Worker takes the job, reads the original and creates the 50 KB thumbnail.
7. Worker saves the thumbnail to object storage and sets the record to `READY`.
8. Feeds now show the photo and the CDN caches it. Failed jobs retry a few times, then go to a dead-letter queue.

## 8. Trade-offs
1. **CDN caching vs freshness:** faster loads and less server load, but a deleted or replaced photo may still show until the cache expires.
2. **Async thumbnails vs instant results:** uploads stay fast, but the thumbnail is not ready immediately and a backed-up queue delays it.
3. **Read replica vs current data:** spreads read load, but replication lag can briefly hide a brand-new photo.