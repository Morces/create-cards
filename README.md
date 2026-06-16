# Creator Cards Microservice API

Welcome to the **Creator Cards Microservice API**, a backend service designed to handle the creation, retrieval, and management of Creator Cards. This project is built utilizing a structured `node-template` architecture and provides a fully validated, robust, and scalable API.

---

## Architecture Overview

The codebase is strictly separated into `@app-core` (framework-level tools) and `@app` (business logic):

```
.
├── core/                  # @app-core: Framework logic (Express, Mongoose, Validator VSL)
├── endpoints/             # @app: Route definitions (POST, GET, DELETE)
├── messages/              # @app: Business rule error definitions (SL02, AC01, etc.)
├── models/                # @app: Mongoose Schemas (CreatorCard)
├── repository/            # @app: Database abstractions
├── services/              # @app: Core business logic and VSL validations
└── app.js                 # Entry point
```

---

## Running the API

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Local or Atlas)

### 1. Installation
Run the following command to install all necessary dependencies:
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory. You can use the standard local setup or provide your own MongoDB Atlas URI (ensure you use the standard connection string format if your network blocks SRV records):

```env
PORT=8811
MONGODB_URI=mongodb://localhost:27017/creator_cards
LOG_APP_REQUEST=1
```

### 3. Start the Server
For development (with hot-reloading via Nodemon):
```bash
npm run dev
```
For production:
```bash
npm start
```

---

## API Endpoints

All endpoints are hosted at the `/creator-cards` path.

### 1. Create a Creator Card
**`POST /creator-cards`**

**Request Payload:**
```json
{
  "title": "My Super Card",
  "description": "This is a great card.",
  "creator_reference": "randomref12345678901",
  "status": "published",
  "access_type": "public"
}
```
**Response Format (Success - 200):**
```json
{
  "status": "success",
  "message": "Creator Card Created Successfully.",
  "data": {
    "id": "01J0G1...",
    "title": "My Super Card",
    "slug": "my-super-card",
    "status": "published",
    "access_type": "public",
    "created": 1718556789000
  }
}
```

### 2. Retrieve a Creator Card
**`GET /creator-cards/:slug`**

Retrieves a card. Private cards require the `access_code` query parameter.

**Examples:**
- Public Card: `GET /creator-cards/my-super-card`
- Private Card: `GET /creator-cards/my-private-card?access_code=ABCDEF`

### 3. Delete a Creator Card
**`DELETE /creator-cards/:slug`**

Soft deletes a creator card.

**Request Payload:**
```json
{
  "creator_reference": "randomref12345678901"
}
```

---

## Error Codes & Validation

Validation is primarily handled by the internal VSL syntax parser. If validation fails, or if a business rule is broken, the API returns a standard `400`, `403`, or `404` error payload containing a specific business rule code:

| Rule | HTTP Status | Code | Meaning |
|---|---|---|---|
| Slug Uniqueness | `400` | `SL02` | The generated or provided slug is already taken. |
| Missing Access Code | `400` | `AC01` | Private cards require a 6-character access code. |
| Invalid Access Code | `400` | `AC05` | Public cards must not have an access code. |
| Not Found | `404` | `NF01` | The card does not exist or was deleted. |
| Draft State | `404` | `NF02` | The card is in a draft state and cannot be viewed. |
| Unauthorized View | `403` | `AC03` | Private card requested without providing an access code. |
| Wrong Access Code | `403` | `AC04` | The provided access code does not match. |

---

## Testing
To run the automated tests (if configured):
```bash
npm test
```
