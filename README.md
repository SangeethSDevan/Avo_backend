# AVO Backend API Documentation
## HTTP Routes

### User Routes
Base URL: `/api/v1/users`

#### 1. **POST /signup**
**Description:** Register a new user account

**Request Body:**
```json
{
  "username": "string (3-20 chars, alphanumeric with . - _)",
  "email": "string (valid email format)",
  "password": "string (min 8 chars, uppercase, lowercase, digit, special char)",
  "name": "string"
}
```

**Validation Rules:**
- Username: Must match pattern `/^[a-zA-Z][a-zA-Z0-9_.-]{2,19}$/`
- Email: Must match pattern `/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/`
- Password: Must match `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-])[A-Za-z\d@$!%*?&#^()_+=\-]{8,}$/`

**Success Response (201):**
```json
{
  "status": "success",
  "message": "Welcome {username}",
  "token": "JWT_TOKEN",
  "data": {
    "username": "string",
    "name": "string",
    "email": "string"
  }
}
```

**Error Responses:**
- `400`: Missing fields or validation failed
- `409`: Username or email already exists
- `500`: Server error

---

#### 2. **POST /login**
**Description:** Authenticate user and receive JWT token

**Request Body:**
```json
{
  "credentials": "string (username or email)",
  "password": "string"
}
```

**Success Response (201):**
```json
{
  "status": "success",
  "message": "Welcome {username}",
  "token": "JWT_TOKEN",
  "data": {
    "username": "string",
    "name": "string",
    "email": "string"
  }
}
```

**Error Responses:**
- `400`: Missing credentials, user not found, or password mismatch
- `500`: Server error

---

### Friend Routes
Base URL: `/api/v1/friends`
**Authentication:** Requires `Authorization: Bearer {token}` header

#### 1. **GET /**
**Description:** Fetch all confirmed friends

**Required Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Success Response (200):**
```json
{
  "status": "fail",
  "message": "Friends fetched sucessfully",
  "data": {
    "length": 5,
    "friends": [
      {
        "friend": {
          "userId": "uuid",
          "username": "string",
          "name": "string"
        }
      }
    ]
  }
}
```

**Error Responses:**
- `400`: userId not found in token
- `500`: Server error

---

#### 2. **POST /add**
**Description:** Send friend request to another user

**Required Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters:**
```
?fd={friendId} (UUID of target user)
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Request sent to your friend!"
}
```

**Error Responses:**
- `400`: 
  - friendID not found
  - Cannot send request to yourself
  - Request already sent or accepted
- `500`: Server error

---

#### 3. **POST /accept**
**Description:** Accept a pending friend request

**Required Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters:**
```
?rd={requestId} (UUID of user who sent request)
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Friend request accepted!"
}
```

**Error Responses:**
- `400`: 
  - userId not found
  - requestID not found
  - Request already accepted
- `404`: Friend request not found (Prisma error P2025)
- `500`: Server error

**Transaction Details:**
- Updates request status from `SENT` to `CONFIRMED`
- Creates reverse relationship with `CONFIRMED` status

---

#### 4. **DELETE /delete**
**Description:** Reject or delete a friend request/relationship

**Required Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters:**
```
?rd={requestId} (UUID of friend/requester)
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Request deleted successfully!"
}
```

**Error Responses:**
- `400`: userId not found
- `404`: Friend request not found
- `500`: Server error

**Behavior:**
- If relationship is `CONFIRMED`, deletes both directions
- If relationship is `SENT`, deletes only the specified direction

---

## Socket.IO Events

### Client → Server Events

#### 1. **FIND_PARTNER**
**Description:** Join waiting queue for a focus session partner

**Payload:**
```typescript
duration: number // Session duration in hours
```

**Server Response (if match found):**
```json
{
  "roomId": "uuid",
  "duration": 1,
  "batchCount": 1,
  "breakCount": 1,
  "users": ["socketId1", "socketId2"],
  "readyCount": 0
}
```

**Server Response (if waiting):**
```
"WAITING_FOR_PARTNER"
```

**Break Calculation Logic:**
- If duration < 1: breakCount = 0
- If duration = 1: breakCount = 1
- If duration > 1: breakCount = duration * 2 - 1

---

#### 2. **SESSION_START**
**Description:** Signal readiness to start focus session

**Payload:**
```typescript
roomId: string
```

**Behavior:**
- Increments `readyCount` in the room
- When `readyCount === 2`, transitions room from `connections` to `activeConnections`
- Calculates break timestamps
- Emits `SESSION_STARTED` to room

---

### Server → Client Events

#### 1. **MATCH_FOUND**
**Emitted when:** Two users with matching duration are found

**Payload:**
```typescript
{
  roomId: string,
  duration: number,
  batchCount: number,
  breakCount: number,
  users: string[], // socket IDs
  readyCount: number
}
```

---

#### 2. **WAITING_FOR_PARTNER**
**Emitted when:** No matching partner found, user added to queue

---

#### 3. **SESSION_STARTED**
**Emitted when:** Both users ready and session begins

---

#### 4. **TIMER_STAT**
**Emitted every 1 second during active session**

**Payload:**
```typescript
remainingTime: number // milliseconds remaining
```

---

#### 5. **BREAK_START**
**Emitted when:** Break period begins (calculated based on session schedule)

---

#### 6. **BREAK_END**
**Emitted when:** Break period ends

---

#### 7. **SESSION_ENDED**
**Emitted when:** Total session time (focus + breaks) complete

---

#### 8. **SESSION_QUIT**
**Emitted when:** Partner disconnects during active session

---

#### 9. **SESSION_LEFT**
**Emitted when:** Partner disconnects before session starts

---

#### 10. **PARTNER_ERROR**
**Emitted when:** Match found but partner has already disconnected

**Payload:**
```typescript
"Partner disconnected!"
```

---

## Session Lifecycle

### Timeline Example (1 hour session)
```
Duration: 1 hour
Breaks: 1 (5 minutes)
Break Schedule: After 30 minutes

Timeline:
0:00    - Session Start (FOCUS)
30:00   - Break Starts (BREAK)
35:00   - Break Ends, Resume Focus
60:00   - Session Ends
```

### State Transitions

```
User A connects
    ↓
FIND_PARTNER (duration)
    ↓
User B connects with same duration
    ↓
MATCH_FOUND (both users)
    ↓
SESSION_START (User A ready)
    ↓
SESSION_START (User B ready)
    ↓
Room moved to activeConnections
    ↓
Timer starts emitting TIMER_STAT every second
    ↓
BREAK_START → BREAK_END (if applicable)
    ↓
SESSION_ENDED
```

---

## Data Models

### User
```typescript
{
  userId: string (UUID)
  username: string (unique)
  name: string
  email: string (unique)
  password: string (hashed with bcryptjs)
  userFriends: Friends[] // outgoing relationships
  friendRelations: Friends[] // incoming relationships
}
```

### Friends
```typescript
{
  userId: string
  friendId: string
  status: "SENT" | "CONFIRMED" | "REJECTED"
  user: Users (relation)
  friend: Users (relation)
  // Composite primary key: (userId, friendId)
}
```

### Socket Details (In-Memory)
```typescript
{
  socketId: string
  duration: number
}
```

### Room Details
```typescript
{
  roomId: string (UUID)
  duration: number (hours)
  batchCount: number
  breakCount: number
  users: string[] (socket IDs)
  readyCount: number
}
```

### Active Room Details
```typescript
extends RoomDetails
{
  type: "FOCUS" | "BREAK"
  startTime: number (Date.now())
  breaks: {
    start: number
    end: number
    status: "PROGRESS" | "STARTED" | "ENDED"
  }[]
}
```

---

## Error Codes Reference

| Code | Meaning |
|------|---------|
| P2002 | Unique constraint violation |
| P2025 | Record not found |
| 400 | Bad request / validation failed |
| 401 | Unauthorized / invalid token |
| 403 | Forbidden / missing token |
| 404 | Not found |
| 409 | Conflict / duplicate entry |
| 500 | Server error |

---

## Key Implementation Details

1. **Authentication:** JWT-based with middleware validation
2. **Database:** PostgreSQL with Prisma ORM
3. **Real-time:** Socket.IO for live session management
4. **Security:** Passwords hashed with bcryptjs
5. **Transactions:** Atomic friend operations using Prisma transactions