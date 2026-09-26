# File Uploader

A full-stack file storage and sharing app built with Express, Prisma, and Passport. Users can sign up, organize files into nested folders, upload to Cloudinary, and generate time-limited public share links for folders.

Built as part of [The Odin Project](https://www.theodinproject.com/lessons/nodejs-file-uploader) curriculum, including the extra credit folder-sharing feature.

## Features

- **Authentication** — session-based login/signup using Passport.js (Local Strategy), with sessions persisted in Postgres via `prisma-session-store`
- **Nested folders** — full CRUD, with unlimited subfolder nesting and breadcrumb navigation
- **File uploads** — files stored in Cloudinary, with metadata (name, size, MIME type, upload date) tracked in the database
- **File management** — rename, move between folders, view details, download, and delete
- **Validation** — file type and size restrictions enforced via Multer
- **Folder sharing** — generate a public, time-limited link (`/share/:id`) to a folder and its full nested contents, viewable and downloadable without an account

## Tech Stack

| Layer | Tech |
|---|---|
| Server | Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Passport.js (Local Strategy) + express-session |
| Session store | `@quixo3/prisma-session-store` |
| File uploads | Multer (memory storage) |
| Cloud storage | Cloudinary |
| Templating | EJS |
| Validation | express-validator |

## Project Structure

```
├── config/
│   ├── bcrypt.js          # Password hashing helpers
│   ├── cloudinary.js      # Cloudinary SDK config
│   └── passport.js        # Passport LocalStrategy + serialize/deserialize
├── controllers/
│   ├── authController.js
│   ├── fileController.js
│   ├── folderController.js
│   ├── indexController.js
│   └── shareController.js
├── db/                    # Prisma query modules (one class per model)
│   ├── files.js
│   ├── folders.js
│   ├── sharedLinks.js
│   └── user.js
├── errors/
│   └── CustomError.js     # Custom error class carrying an HTTP status code
├── lib/
│   └── prisma.js          # PrismaClient singleton
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── public/
│   └── css/
│       └── style.css
├── routes/
│   ├── authRouter.js
│   ├── fileRouter.js
│   ├── folderRouter.js
│   ├── indexRouter.js
│   └── shareRouter.js     # Public routes — no auth required
├── uploads/                # (legacy/local scratch — not used once Cloudinary is wired up)
├── validators/
│   ├── authValidators.js
│   ├── fileValidators.js
│   └── folderValidators.js
├── views/
│   ├── partials/
│   │   ├── errors.ejs
│   │   ├── file.ejs
│   │   ├── nav.ejs
│   │   └── shared-folder-tree.ejs
│   └── *.ejs
├── app.js
└── .env
```

## Data Model

Five Prisma models:

- **User** — account credentials
- **Session** — required by `prisma-session-store`, backs express-session
- **Folder** — supports nesting via a self-relation (`parentId`); cascades on delete
- **File** — metadata pointing to the Cloudinary asset (`url`, `publicId`, `resourceType`); can live at the root (`folderId: null`) or inside a folder; cascades on parent folder delete
- **SharedLink** — a UUID-keyed record linking to a folder with an `expiresAt` timestamp; powers the public `/share/:id` route

## Setup

### Prerequisites

- Node.js
- PostgreSQL database
- A Cloudinary account

### Installation

```bash
git clone <repo-url>
cd file-uploader
npm install
```

### Environment variables

Create a `.env` file in the project root:

```
DATABASE_URL=postgresql://user:password@localhost:5432/your_db_name?schema=public
SESSION_SECRET=some_long_random_string

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Database setup

```bash
npx prisma migrate dev
npx prisma generate
```

### Run the app

```bash
node app.js
```

The app runs on `http://localhost:8080` by default.

## Routes Overview

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| GET | `/` | No | Landing page (redirects to `/dashboard` if logged in) |
| GET / POST | `/auth/sign-up` | No | Sign up |
| GET / POST | `/auth/log-in` | No | Log in |
| POST | `/auth/log-out` | Yes | Log out |
| GET | `/dashboard` | Yes | Top-level folders and root files |
| GET / POST | `/folders/new` | Yes | Create folder |
| GET | `/folders/:id` | Yes | View folder contents + breadcrumbs |
| GET / POST | `/folders/:id/rename` | Yes | Rename folder |
| POST | `/folders/:id/delete` | Yes | Delete folder (cascades to subfolders/files, including Cloudinary cleanup) |
| GET / POST | `/folders/:id/share` | Yes | Generate a public share link |
| GET / POST | `/files/upload` | Yes | Upload a file |
| GET | `/files/:id` | Yes | View file details |
| GET | `/files/:id/download` | Yes | Download file |
| GET / POST | `/files/:id/rename` | Yes | Rename file |
| GET / POST | `/files/:id/move` | Yes | Move file to another folder |
| POST | `/files/:id/delete` | Yes | Delete file (removes from Cloudinary too) |
| GET | `/share/:id` | **No** | Public read-only view of a shared folder tree |
| GET | `/share/:id/download/:fileId` | **No** | Public download, scoped to files within the shared folder's tree |

## Security Notes

- Every folder/file query is scoped by `userId`, preventing access to another user's data via ID guessing
- The public share route validates that a requested file actually belongs within the shared folder's subtree before allowing download
- Uploads are validated by MIME type and size limit via Multer
- Files are stored in Cloudinary rather than the local filesystem, avoiding direct static-file exposure

## Extra Credit

Implemented: **folder sharing with expiring links.** Users can generate a `/share/:id` link for any folder they own, choosing a duration (1/7/30 days). The link is publicly viewable (no login) and recursively renders the folder's full nested subtree, with per-file downloads. Links stop working automatically once `expiresAt` has passed.

## Future Improvements

- **Content-based file validation** — current validation trusts the client-reported MIME type; verifying actual file content (e.g. via magic-byte sniffing) would close the gap where a renamed file extension slips past the filter
- **Revoke share links early** — currently a link is only invalidated by expiry; adding a "revoke" button would let users kill a link before its natural expiration
- **Search** — no way to search across folders/files by name yet; useful once a user has more than a handful of items
- **Pagination** — folder/dashboard views load everything at once; would need pagination or lazy loading for users with large numbers of files
- **Drag-and-drop upload** — current upload is a standard file input; a drag-and-drop zone would improve the experience
- **Thumbnails/previews** — image and PDF previews in file listings, rather than just a generic icon
- **Bulk actions** — select multiple files/folders to move or delete at once
- **Retry/cleanup job for orphaned Cloudinary assets** — if a Cloudinary deletion silently fails (currently logged and skipped), there's no follow-up mechanism to catch and clean up the orphaned asset later
- **Rate limiting** — no throttling currently on login attempts or uploads; worth adding for a production deployment
- **Password reset flow** — currently no way to recover a forgotten password
- **Materialized breadcrumb/folder paths** — breadcrumbs currently walk up `parentId` per request; precomputing paths would reduce query count for very deep nesting