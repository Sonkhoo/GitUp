# GitUp — GitHub-style Todo & Habit Heatmap Tracker

## Project Overview

GitUp is a minimal, cozy productivity app that visualizes daily consistency using **GitHub-style contribution heatmaps**. It focuses on **accountability over task hoarding**, encouraging users to complete what they start instead of inflating activity.

The product is intentionally opinionated:

* Limited incomplete todos (max 3)
* Immutable daily activity
* Read-only social visibility (GitHub-style followers)
* Clean identity separation (username vs display name)

The goal is not feature density, but **honest daily progress**.

---

## Core Features

### 1. Authentication & Onboarding

**Auth Methods**
* GitHub OAuth (primary)
* Email magic link (optional)
* No passwords

**First-Time Onboarding Flow**

After successful OAuth, users see a **one-time popup** requesting:

1. **Username** (required, unique, URL-safe)
   - lowercase only
   - characters: `a-z`, `0-9`, `-`, `_`
   - Live availability check
   - Auto-suggestions if taken (`username_1`, `username_dev`)

2. **Display Name** (required, non-unique, editable)
   - Any text allowed
   - Used for visual display only
   - Can be changed later

The app is **blocked until onboarding is completed**.

**Identity Model**

```ts
id:          "ckx9..."        // Internal UUID
username:    "sonkhoo"         // Unique, public, URL
displayName: "Sonkhoo"         // Non-unique, human-friendly
```

This follows GitHub's exact pattern.

---

### 2. Todo System

**Core Functionality**
* Add text-based todos
* Maximum **3 incomplete todos** per user at any time
* Todos are permanently tied to their creation date
* Actions: Complete, Delete (soft delete)

**Business Rules**
* Deleted todos **still count** toward that day's total activity
* Todos cannot be rescheduled or moved to another day
* Cannot add new todos if 3 incomplete todos already exist
* Prevents gaming the heatmap by moving tasks

**Daily Activity Tracking**
Each day records:
* Total todos created
* Total todos completed
* Completion percentage (used for heatmap intensity)

---

### 3. Todo Heatmap (Global)

**Visual Design**
* One unified heatmap per user
* GitHub-style grid:
  - 7 rows (Sunday–Saturday)
  - Weekly columns (52+ weeks visible)
  - Square cells with hover tooltips

**Intensity Logic**

```
intensity = completed_todos / total_todos_created_that_day
```

**Color Levels**

| Completion % | Heatmap Level | Description |
|--------------|---------------|-------------|
| 0%           | 0             | Empty/gray  |
| 1–25%        | 1             | Light green |
| 26–50%       | 2             | Medium green|
| 51–75%       | 3             | Dark green  |
| 76–100%      | 4             | Darkest green|

**Edge Cases**
* Day with 0 todos created = Level 0 (empty)
* Day with 1/1 completed = Level 4 (100%)
* Historical data remains unchanged when todos are deleted later

---

### 4. Habit System

**Core Functionality**
* Create named habits with start date
* Each habit has its **own independent heatmap**
* Daily binary completion (done/not done)
* Streak tracking:
  - Current streak (consecutive days)
  - Longest streak ever

**Privacy**
* Habits are **private by default**
* Not visible to followers (v1)
* Optional public sharing in future versions

**Habit Heatmap Logic**
* Completed day = Level 4 (full green)
* Missed day = Level 0 (empty)
* No partial completion

---

### 5. Social System (GitHub-style Followers)

**Follow Model** (not "friends")

Users can follow anyone without approval. There are no friend requests.

**What Followers Can See**
* Todo heatmap (read-only)
* Basic profile info (username, display name)
* Streak statistics
* Achievements

**What Followers CANNOT See**
* Individual todo text/content
* Habits (v1)
* Private profile sections

**Mutual Following**
* If User A follows User B, and B follows A → "mutuals" (optional label)
* Not required for visibility

**Discovery**
* Search by username (primary)
* Search by display name (secondary, fuzzy match)
* Profile URLs use username only: `/u/{username}`

**Visibility Settings** (future)
* Public: anyone can view
* Followers only: default (v1)
* Private: nobody can view

---

### 6. Achievements (Derived)

All achievements are **computed on-the-fly** from existing data. No achievement state is stored.

**Todo Achievements**
* 7-day streak (7 consecutive days with ≥1 todo completed)
* 30-day streak
* 100 total completions
* Full green week (7 consecutive days at 100%)
* Perfect month (30 days at 100%)

**Habit Achievements** (per habit)
* 7-day streak
* 30-day streak
* 100-day streak
* Longest streak ever

---

## Frontend Pages

### 1. Auth Page (`/login`)

**Purpose**: Login and account creation

**Elements**
* GitHub OAuth button
* Email magic link input
* Minimal branding
* No registration form (handled via OAuth)

---

### 2. Onboarding Popup (first login only)

**Trigger**: After OAuth when `username IS NULL`

**Fields**
1. Username input with live validation
2. Display name input
3. Submit button (blocked until valid)

**Validation**
* Username: unique, lowercase, URL-safe
* Display name: any text, required
* Real-time availability check for username

---

### 3. Home Page (`/`)

**Purpose**: Dashboard and navigation hub

**Elements**
* Welcome message with display name
* Quick stats (current streak, total completions)
* Navigation cards:
  - Todos
  - Habits
  - Followers/Following
* Global todo heatmap preview

---

### 4. Todo Page (`/todos`)

**Purpose**: Manage daily todos and view heatmap

**Sections**

**Today's Todos**
* List of todos for selected date (default: today)
* Add todo input (disabled if 3 incomplete exist)
* Complete/delete actions per todo
* Incomplete todo counter (X/3)

**Global Todo Heatmap**
* Full year view
* Interactive cells with tooltips:
  - Date
  - Todos completed/total
  - Completion percentage
* Day selector on click

**Stats Panel**
* Current streak
* Longest streak
* Total completions
* Achievements unlocked

---

### 5. Habit Page (`/habits`)

**Purpose**: Manage habits and track streaks

**Sections**

**Habit List**
* Create new habit button
* List of existing habits with:
  - Habit name
  - Current streak
  - Longest streak
  - Quick complete button (for today)

**Per-Habit View** (when habit selected)
* Individual habit heatmap
* Detailed streak statistics
* Edit/delete habit options
* Achievement badges

---

### 6. Profile Page (`/u/{username}`)

**Purpose**: Public/follower-visible profile

**Own Profile** (`/u/{current_user}`)
* Editable display name
* Todo heatmap
* Stats and achievements
* Follower/following counts
* Settings link

**Other User's Profile** (`/u/{other_user}`)
* Display name
* Todo heatmap (if following or public)
* Stats (if visible)
* Follow/unfollow button
* Follower/following counts

---

### 7. Social Page (`/social`)

**Purpose**: Manage following relationships and discover users

**Sections**

**Following Tab**
* List of users you follow
* Quick link to their profiles
* Unfollow action
* Activity preview (recent streak status)

**Followers Tab**
* List of users following you
* Follow back button (if not mutual)

**Discover Tab**
* Search by username or display name
* User cards with:
  - Display name
  - @username
  - Follow button
  - Mini heatmap preview

---

## Backend Data Model

### User

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  username     String    @unique
  displayName  String
  
  githubId     String?   @unique
  emailVerified DateTime?
  
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  todos        Todo[]
  habits       Habit[]
  followers    Follow[]  @relation("Following")
  following    Follow[]  @relation("Follower")
}
```

---

### Todo

```prisma
model Todo {
  id          String    @id @default(cuid())
  userId      String
  text        String
  
  completed   Boolean   @default(false)
  completedAt DateTime?
  
  deleted     Boolean   @default(false)
  deletedAt   DateTime?
  
  createdDate DateTime  @db.Date  // Date only (not timestamp)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, createdDate])
  @@index([userId, completed])
}
```

**Key Points**
* `createdDate` is a date-only field (YYYY-MM-DD)
* Todos are never truly deleted (`deleted` flag)
* `completedAt` tracks when completion happened

---

### Habit

```prisma
model Habit {
  id          String    @id @default(cuid())
  userId      String
  name        String
  
  startDate   DateTime  @db.Date
  archived    Boolean   @default(false)
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  completions HabitCompletion[]
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}
```

---

### HabitCompletion

```prisma
model HabitCompletion {
  id          String    @id @default(cuid())
  habitId     String
  completedDate DateTime @db.Date
  
  createdAt   DateTime  @default(now())
  
  habit       Habit     @relation(fields: [habitId], references: [id], onDelete: Cascade)
  
  @@unique([habitId, completedDate])
  @@index([habitId, completedDate])
}
```

**Key Points**
* One row per day per habit (binary completion)
* Unique constraint prevents double-completion

---

### Follow

```prisma
model Follow {
  id          String    @id @default(cuid())
  followerId  String
  followingId String
  
  createdAt   DateTime  @default(now())
  
  follower    User      @relation("Follower", fields: [followerId], references: [id], onDelete: Cascade)
  following   User      @relation("Following", fields: [followingId], references: [id], onDelete: Cascade)
  
  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}
```

**Key Points**
* Unidirectional relationship
* No approval required
* Self-follows are prevented at application level

---

## Backend Routes

### Auth Routes

```
POST   /api/auth/login              # Initiate OAuth flow
GET    /api/auth/callback           # OAuth callback handler
GET    /api/auth/session            # Get current session
POST   /api/auth/logout             # End session
POST   /api/auth/magic-link         # Send email magic link
```

---

### Onboarding Routes

```
GET    /api/onboarding/required     # Check if onboarding needed
POST   /api/onboarding/complete     # Submit username + display name
GET    /api/onboarding/check/:username  # Check username availability
```

**POST /api/onboarding/complete**

Request:
```json
{
  "username": "sonkhoo",
  "displayName": "Sonkhoo"
}
```

Response:
```json
{
  "success": true,
  "user": {
    "id": "ckx9...",
    "username": "sonkhoo",
    "displayName": "Sonkhoo"
  }
}
```

---

### Todo Routes

```
POST   /api/todos                   # Create new todo
GET    /api/todos?date=YYYY-MM-DD   # Get todos for date
PATCH  /api/todos/:id/complete      # Mark complete
PATCH  /api/todos/:id/uncomplete    # Mark incomplete
DELETE /api/todos/:id               # Soft delete todo
```

**POST /api/todos**

Request:
```json
{
  "text": "Review pull requests",
  "date": "2025-12-14"  // Optional, defaults to today
}
```

Response:
```json
{
  "id": "ckx9...",
  "text": "Review pull requests",
  "completed": false,
  "createdDate": "2025-12-14"
}
```

Errors:
* `400`: Already have 3 incomplete todos
* `401`: Not authenticated

---

### Habit Routes

```
POST   /api/habits                  # Create new habit
GET    /api/habits                  # Get all user habits
PATCH  /api/habits/:id              # Update habit name
DELETE /api/habits/:id              # Archive habit
POST   /api/habits/:id/complete     # Mark today as complete
DELETE /api/habits/:id/complete     # Unmark today
```

**POST /api/habits**

Request:
```json
{
  "name": "Morning run",
  "startDate": "2025-12-01"
}
```

**POST /api/habits/:id/complete**

Request: (empty body or `{ "date": "YYYY-MM-DD" }`)

Response:
```json
{
  "habitId": "ckx9...",
  "completedDate": "2025-12-14",
  "currentStreak": 7
}
```

---

### Follow Routes

```
POST   /api/follow/:userId          # Follow a user
DELETE /api/follow/:userId          # Unfollow a user
GET    /api/follow/following        # Get users I follow
GET    /api/follow/followers        # Get my followers
GET    /api/follow/status/:userId   # Check if following/followed
```

**POST /api/follow/:userId**

Response:
```json
{
  "success": true,
  "following": true
}
```

**GET /api/follow/status/:userId**

Response:
```json
{
  "following": true,     // I follow them
  "followedBy": false,   // They follow me
  "mutual": false
}
```

---

### User/Profile Routes

```
GET    /api/users/:username         # Get public profile
PATCH  /api/users/me                # Update own profile
GET    /api/users/search?q=query    # Search users
```

**GET /api/users/:username**

Response:
```json
{
  "username": "sonkhoo",
  "displayName": "Sonkhoo",
  "createdAt": "2025-01-15T10:00:00Z",
  "stats": {
    "totalCompletions": 234,
    "currentStreak": 12,
    "longestStreak": 45
  },
  "followerCount": 15,
  "followingCount": 23
}
```

---

### Heatmap Routes

```
GET /api/heatmap/todos?year=2025           # Todo heatmap data
GET /api/heatmap/habits/:habitId?year=2025 # Habit heatmap data
GET /api/heatmap/user/:username?year=2025  # Other user's todo heatmap
```

**GET /api/heatmap/todos?year=2025**

Response:
```json
{
  "year": 2025,
  "data": [
    {
      "date": "2025-12-14",
      "level": 4,
      "completed": 3,
      "total": 3
    },
    {
      "date": "2025-12-13",
      "level": 2,
      "completed": 1,
      "total": 2
    }
  ],
  "stats": {
    "currentStreak": 12,
    "longestStreak": 45,
    "totalCompletions": 234
  }
}
```

**Heatmap Aggregation Query** (PostgreSQL)

```sql
SELECT 
  DATE(created_date) as date,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE completed = true) as completed,
  CASE 
    WHEN COUNT(*) = 0 THEN 0
    WHEN COUNT(*) FILTER (WHERE completed = true)::float / COUNT(*) <= 0.25 THEN 1
    WHEN COUNT(*) FILTER (WHERE completed = true)::float / COUNT(*) <= 0.50 THEN 2
    WHEN COUNT(*) FILTER (WHERE completed = true)::float / COUNT(*) <= 0.75 THEN 3
    ELSE 4
  END as level
FROM todos
WHERE user_id = $1 
  AND EXTRACT(YEAR FROM created_date) = $2
  AND deleted = false
GROUP BY DATE(created_date)
ORDER BY date;
```

---

### Achievement Routes

```
GET /api/achievements/todos          # Get todo achievements
GET /api/achievements/habits/:id     # Get habit achievements
```

Response:
```json
{
  "achievements": [
    {
      "id": "7-day-streak",
      "name": "Week Warrior",
      "description": "7-day completion streak",
      "unlocked": true,
      "unlockedAt": "2025-12-10"
    },
    {
      "id": "30-day-streak",
      "name": "Monthly Master",
      "unlocked": false
    }
  ],
  "progress": {
    "currentStreak": 12,
    "totalCompletions": 234
  }
}
```

---

## Technology Stack

### Frontend

* **Next.js 14+** (App Router)
* **React 18+** (Server Components by default)
* **TypeScript** (strict mode)
* **Tailwind CSS** (utility-first styling)
* **Radix UI** (accessible primitives for dialogs, tooltips)
* **Lucide React** (icons)
* **date-fns** (date manipulation)

---

### Backend

* **Next.js Route Handlers** (API routes)
* **Server Actions** (form submissions, mutations)
* **Prisma** (ORM)
* **PostgreSQL** (primary database)
* **Neon** (serverless Postgres hosting)

---

### Authentication

* **Auth.js (NextAuth v5)** (authentication framework)
* **GitHub OAuth** (primary login)
* **Email Magic Links** (passwordless backup)
* **JWT** (session tokens)

---

### DevOps & Deployment

* **Vercel** (hosting, serverless functions, SSR)
* **GitHub Actions** (CI/CD, optional)
* **Sentry** (error tracking, optional)
* **Vercel Analytics** (performance monitoring)

---

### Development Tools

* **ESLint** (linting)
* **Prettier** (code formatting)
* **Husky** (git hooks)
* **tsx** (TypeScript execution for scripts)
* **Prisma Studio** (database GUI)

---

## Project Structure

```
gitup/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── onboarding/
│   ├── (dashboard)/
│   │   ├── page.tsx                 # Home
│   │   ├── todos/
│   │   │   └── page.tsx
│   │   ├── habits/
│   │   │   └── page.tsx
│   │   └── social/
│   │       └── page.tsx
│   ├── u/
│   │   └── [username]/
│   │       └── page.tsx             # Profile
│   ├── api/
│   │   ├── auth/
│   │   ├── todos/
│   │   ├── habits/
│   │   ├── follow/
│   │   ├── users/
│   │   ├── heatmap/
│   │   └── achievements/
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                          # Radix primitives
│   ├── heatmap/
│   │   ├── TodoHeatmap.tsx
│   │   └── HabitHeatmap.tsx
│   ├── todos/
│   │   ├── TodoList.tsx
│   │   └── TodoItem.tsx
│   ├── habits/
│   │   ├── HabitList.tsx
│   │   └── HabitCard.tsx
│   ├── profile/
│   │   └── UserProfile.tsx
│   └── onboarding/
│       └── OnboardingModal.tsx
│
├── lib/
│   ├── auth.ts                      # Auth.js config
│   ├── db.ts                        # Prisma client
│   ├── utils.ts                     # Shared utilities
│   └── constants.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── public/
│   └── images/
│
├── .env.local
├── .eslintrc.json
├── next.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## Key Business Logic

### 1. Incomplete Todo Limit (3 max)

**Enforcement Point**: Before creating new todo

```ts
const incompleteTodos = await prisma.todo.count({
  where: {
    userId: session.user.id,
    completed: false,
    deleted: false
  }
});

if (incompleteTodos >= 3) {
  throw new Error("Cannot create more than 3 incomplete todos");
}
```

---

### 2. Todo Immutability (No Rescheduling)

Todos are permanently assigned to their `createdDate`. There is **no API route** to change this field.

---

### 3. Deleted Todos Count Toward Heatmap

When computing heatmap intensity:

```ts
// Include deleted todos in total count
const totalTodos = await prisma.todo.count({
  where: {
    userId,
    createdDate: date
    // NO deleted: false filter
  }
});

const completedTodos = await prisma.todo.count({
  where: {
    userId,
    createdDate: date,
    completed: true
    // NO deleted: false filter
  }
});
```

This prevents users from deleting bad days to improve their heatmap.

---

### 4. Username Validation

```ts
const USERNAME_REGEX = /^[a-z0-9_-]+$/;

function isValidUsername(username: string): boolean {
  return (
    username.length >= 3 &&
    username.length <= 20 &&
    USERNAME_REGEX.test(username)
  );
}
```

---

### 5. Follow Visibility Rules

```ts
async function canViewUserHeatmap(
  viewerId: string,
  targetUserId: string
): Promise<boolean> {
  // Can always view own profile
  if (viewerId === targetUserId) return true;
  
  // Check if following
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: viewerId,
        followingId: targetUserId
      }
    }
  });
  
  return follow !== null;
  
  // Future: add public profile check
}
```

---

### 6. Streak Calculation

```ts
function calculateStreak(completionDates: Date[]): number {
  if (completionDates.length === 0) return 0;
  
  // Sort dates descending
  const sorted = completionDates.sort((a, b) => b.getTime() - a.getTime());
  
  let streak = 0;
  let expectedDate = new Date();
  expectedDate.setHours(0, 0, 0, 0);
  
  for (const date of sorted) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    
    if (d.getTime() === expectedDate.getTime()) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (d.getTime() < expectedDate.getTime()) {
      break; // Streak broken
    }
  }
  
  return streak;
}
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/gitup?sslmode=require"

# Auth.js
AUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Email (optional, for magic links)
EMAIL_SERVER="smtp://user:pass@smtp.example.com:587"
EMAIL_FROM="noreply@gitup.app"

# App
NEXT_PUBLIC_APP_URL="https://gitup.app"
```

---

## Deployment Checklist

### Pre-Deploy

- [ ] Set all environment variables in Vercel
- [ ] Run database migrations on production DB
- [ ] Configure GitHub OAuth callback URL
- [ ] Set up custom domain in Vercel
- [ ] Enable automatic SSL

### Post-Deploy

- [ ] Test OAuth login flow
- [ ] Test onboarding flow
- [ ] Verify heatmap rendering
- [ ] Test follow/unfollow
- [ ] Check mobile responsiveness
- [ ] Set up error tracking (Sentry)
- [ ] Configure analytics

---

## Design Philosophy

### Principles

1. **Cozy, not clinical**: Soft colors, rounded corners, friendly copy
2. **Quiet UI**: No notifications, no popups (except onboarding)
3. **No gamification abuse**: No points, levels, or badges for participation
4. **Accountability over theater**: Can't hide bad days or game the system
5. **Read-only social**: Encourages passive inspiration, not competition
6. **Immutable history**: What happened, happened

### Visual Language

* **Colors**: Green heatmap (GitHub-inspired), soft neutrals
* **Typography**: System fonts, clear hierarchy
* **Spacing**: Generous whitespace, breathable layouts
* **Animations**: Subtle, purposeful (no confetti yet)

---

## Future Enhancements (Post-MVP)

### Phase 2

* User avatars (upload + gravatar fallback)
* Public profile toggle (opt-in)
* Shareable heatmap cards (Open Graph images)
* Dark mode
* Mobile app (React Native)

### Phase 3

* Habit visibility to followers (opt-in)
* Collaborative habits (e.g., "30-day challenge" groups)
* Leaderboards (opt-in, by followers only)
* Export data (CSV, JSON)

### Polish

* Confetti animation on streak milestones
* Ambient lo-fi music player (optional)
* Todo reminders (email/push, opt-in)
* Undo delete (30-day window)
* Keyboard shortcuts

---

## Development Workflow

### Setup

```bash
# Clone repo
git clone https://github.com/yourusername/gitup.git
cd gitup

# Install dependencies
npm install

# Set up database
cp .env.example .env.local
# Edit .env.local with your values

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed

# Start dev server
npm run dev
```

### Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Run Prettier

npx prisma studio    # Open database GUI
npx prisma migrate dev --name <name>  # Create migration
npx prisma generate  # Regenerate Prisma Client
```

---

## API Response Patterns

### Success

```json
{
  "success": true,
  "data": { ... }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "INCOMPLETE_TODOS_LIMIT",
    "message": "Cannot have more than 3 incomplete todos"
  }
}
```

### Common Error Codes

* `UNAUTHENTICATED`: Not logged in
* `UNAUTHORIZED`: Logged in but not authorized
* `NOT_FOUND`: Resource doesn't exist
* `VALIDATION_ERROR`: Invalid input
* `INCOMPLETE_TODOS_LIMIT`: Hit 3-todo limit
* `USERNAME_TAKEN`: Username already exists
* `INVALID_USERNAME`: Username format invalid

---

## Testing Strategy

### Unit Tests

* Streak calculation logic
* Heatmap intensity calculation
* Username validation
* Date utilities

### Integration Tests

* Auth flow (OAuth + magic link)
* Onboarding completion
* Todo CRUD operations
* Follow/unfollow
* Heatmap data aggregation

### E2E Tests (Playwright)

* Complete user journey: signup → onboarding → create todos → view heatmap
* Follow another user and view their profile
* Habit creation and completion

---

## Performance Considerations

### Database Indexes

Critical indexes are defined in Prisma schema:

* `User.username` (unique)
* `User.email` (unique)
* `Todo.userId + createdDate` (compound)
* `Todo.userId + completed` (compound)
* `Follow.followerId + followingId` (unique compound)
* `HabitCompletion.habitId + completedDate` (unique compound)

### Caching Strategy

* Server Components cache by default (Next.js)
* Heatmap data cached for 1 hour (stale-while-revalidate)
* Profile data cached for 5 minutes
* User search results cached for 1 hour

### Query Optimization

* Use `SELECT` only needed fields
* Paginate follower/following lists (100 per page)
* Limit heatmap queries to 1 year max
* Use database views for complex aggregations (future)

---

## Security

### Authentication

* CSRF protection (Auth.js built-in)
* Secure cookie flags (`httpOnly`, `secure`, `sameSite`)
* JWT expiration (30 days)
* Rate limiting on auth endpoints

### Authorization

* Session validation on every API route
* User ownership checks (can only modify own todos/habits)
* Follow visibility enforcement

### Input Validation

* Zod schemas for all API inputs
* SQL injection prevention (Prisma parameterized queries)
* XSS prevention (React automatic escaping)

### Rate Limiting

* 100 requests/minute per user
* 10 requests/minute for search
* 5 login attempts per hour per IP

---

## Monitoring & Observability

### Metrics to Track

* Daily active users (DAU)
* Todo completion rate
* Average todos per user per day
* Streak distribution (histogram)
* Follow/following ratios
* Onboarding completion rate

### Error Tracking

* Sentry integration for runtime errors
* Custom error boundaries in React
* API error logging with context

### Performance

* Vercel Analytics (Core Web Vitals)
* Database query timing (Prisma logging)
* API response times

---

## License

MIT License - See LICENSE file