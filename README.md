# Creator Card Microservice API

Node.js and Express backend assessment implementation for Creator Cards. The API lets creators create, publicly retrieve, and soft-delete shareable profile cards with links and service rates.

The service follows the provided backend template structure:

```text
Endpoint -> Service -> Repository -> MongoDB
```

MongoDB is used for persistence. Documents store their identifier as `_id` internally, and API responses serialize that value as `id`.

## Submission Base URL

```text
https://creator-mania-2492ff6a2e03.herokuapp.com
```

Submit only the base URL above. Do not include `/creator-cards`, `/api`, `/v1`, or `/api/v1` in the assessment submission form.

Assessment endpoints:

```text
POST   https://creator-mania-2492ff6a2e03.herokuapp.com/creator-cards
GET    https://creator-mania-2492ff6a2e03.herokuapp.com/creator-cards/:slug
DELETE https://creator-mania-2492ff6a2e03.herokuapp.com/creator-cards/:slug
```

## Requirements Covered

- No authentication required.
- No API URL versioning.
- MongoDB-backed persistence.
- ULID `_id` stored internally and returned as `id`.
- `_id` is never returned in API responses.
- Retrieval responses never include `access_code`.
- Public create/delete responses include `access_code: null`.
- Draft cards are not publicly retrievable.
- Deleted cards are not retrievable.
- Dates are Unix epoch milliseconds as numbers.
- Field-level validation uses the template VSL validator.
- Business-rule errors use the template error utilities and custom error codes.

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Set the local MongoDB connection string in `.env`:

```text
MONGODB_URI=mongodb://127.0.0.1:27017/creator_card_assessment
```

Run locally:

```bash
node bootstrap.js
```

Run tests:

```bash
npm test
```

## Environment Variables

Required:

```text
MONGODB_URI   MongoDB connection string
```

Optional:

```text
PORT                          HTTP port. Heroku supplies this automatically.
PINO_LOG_LEVEL                Logger level, for example error
LOG_APP_REQUEST               Enable request logging when set to 1
CAN_LOG_ENDPOINT_INFORMATION  Generate endpoint metadata when set
USE_MOCK_MODEL                Used only by tests
```

Do not set `USE_MOCK_MODEL` in production.

## MongoDB

Creator Cards are persisted in the `creator_cards` collection.

The `slug` field has a unique MongoDB index. Slug uniqueness is enforced across active and soft-deleted cards.

For MongoDB Atlas deployment, set `MONGODB_URI` to a cloud connection string:

```text
mongodb+srv://<user>:<password>@<cluster>/creator_card_assessment?retryWrites=true&w=majority
```

If the database password contains special characters, URL-encode them before placing the URI in environment variables.

## Deployment

The app is deployed on Heroku.

The included `Procfile` starts the web process:

```text
web: node bootstrap.js
```

Heroku provides the `PORT` environment variable. Set only the required app configuration, especially `MONGODB_URI`.

Useful Heroku commands:

```bash
heroku config:set MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>/creator_card_assessment?retryWrites=true&w=majority"
heroku config:set PINO_LOG_LEVEL=error
git push heroku main
heroku logs --tail
```

For Render or similar platforms, use the same start command:

```bash
node bootstrap.js
```

## API Endpoints

All endpoints are mounted at the root of the base URL.

```text
POST   /creator-cards
GET    /creator-cards/:slug
DELETE /creator-cards/:slug
```

There is no `/api`, `/v1`, or `/api/v1` prefix.

## Create Creator Card

```http
POST /creator-cards
```

Example request:

```json
{
  "title": "George Cooks",
  "description": "Weekly cooking podcast",
  "slug": "george-cooks",
  "creator_reference": "crt_8f2k1m9x4p7w3q5z",
  "links": [
    { "title": "YouTube", "url": "https://youtube.com/@georgecooks" }
  ],
  "service_rates": {
    "currency": "NGN",
    "rates": [
      {
        "name": "IG Story Post",
        "description": "One story mention",
        "amount": 5000000
      }
    ]
  },
  "status": "published",
  "access_type": "public"
}
```

Success response:

```json
{
  "status": "success",
  "message": "Creator Card Created Successfully.",
  "data": {
    "id": "01JG8XYZA2B3C4D5E6F7G8H9J0",
    "title": "George Cooks",
    "description": "Weekly cooking podcast",
    "slug": "george-cooks",
    "creator_reference": "crt_8f2k1m9x4p7w3q5z",
    "links": [
      { "title": "YouTube", "url": "https://youtube.com/@georgecooks" }
    ],
    "service_rates": {
      "currency": "NGN",
      "rates": [
        {
          "name": "IG Story Post",
          "description": "One story mention",
          "amount": 5000000
        }
      ]
    },
    "status": "published",
    "access_type": "public",
    "access_code": null,
    "created": 1767052800000,
    "updated": 1767052800000,
    "deleted": null
  }
}
```

Slug behavior:

- If `slug` is provided, it must be unique.
- A duplicate client-provided slug returns `SL02`.
- If `slug` is omitted, it is generated from the title by lowercasing, replacing whitespace with hyphens, and removing characters other than letters, numbers, hyphens, and underscores.
- If the generated slug is shorter than 5 characters or already taken, a random 6-character alphanumeric suffix is appended.

Access-code behavior:

- `access_type` defaults to `public`.
- Private cards require `access_code`.
- Public cards must not supply `access_code`.
- Public create responses return `access_code: null`.

## Retrieve Creator Card

```http
GET /creator-cards/:slug
```

Private card access:

```http
GET /creator-cards/vip-rate-card?access_code=A1B2C3
```

Success response:

```json
{
  "status": "success",
  "message": "Creator Card Retrieved Successfully.",
  "data": {
    "id": "01JG8XYZA2B3C4D5E6F7G8H9J0",
    "title": "George Cooks",
    "description": "Weekly cooking podcast",
    "slug": "george-cooks",
    "creator_reference": "crt_8f2k1m9x4p7w3q5z",
    "links": [
      { "title": "YouTube", "url": "https://youtube.com/@georgecooks" }
    ],
    "service_rates": {
      "currency": "NGN",
      "rates": [
        {
          "name": "IG Story Post",
          "description": "One story mention",
          "amount": 5000000
        }
      ]
    },
    "status": "published",
    "access_type": "public",
    "created": 1767052800000,
    "updated": 1767052800000,
    "deleted": null
  }
}
```

Retrieval access rules:

- Missing or deleted card: `404 NF01`.
- Draft card: `404 NF02`.
- Private card without `access_code`: `403 AC03`.
- Private card with wrong `access_code`: `403 AC04`.
- Retrieval never includes `access_code`, even when the correct private access code is supplied.

## Delete Creator Card

```http
DELETE /creator-cards/:slug
```

Example request:

```json
{
  "creator_reference": "crt_8f2k1m9x4p7w3q5z"
}
```

`creator_reference` is required and must be exactly 20 characters.

Success response:

```json
{
  "status": "success",
  "message": "Creator Card Deleted Successfully.",
  "data": {
    "id": "01JG8XYZA2B3C4D5E6F7G8H9J0",
    "title": "George Cooks",
    "slug": "george-cooks",
    "creator_reference": "crt_8f2k1m9x4p7w3q5z",
    "status": "published",
    "access_type": "public",
    "access_code": null,
    "created": 1767052800000,
    "updated": 1767139200000,
    "deleted": 1767139200000
  }
}
```

Delete behavior:

- Missing or already-deleted card: `404 NF01`.
- Successful deletion is a soft delete.
- After deletion, `GET /creator-cards/:slug` returns `404 NF01`.
- Delete responses use the same data serialization format as create responses.

## Field Validation

Validation failures return HTTP 400 using the template validator response format.

Key validation rules:

- `title`: required string, 3 to 100 characters.
- `description`: optional string, max 500 characters.
- `slug`: optional string, 5 to 50 characters, letters, numbers, hyphens, and underscores only.
- `creator_reference`: required string, exactly 20 characters.
- `links[].title`: string, 1 to 100 characters.
- `links[].url`: string, max 200 characters, starts with `http://` or `https://`.
- `service_rates.currency`: `NGN`, `USD`, `GBP`, or `GHS`.
- `service_rates.rates`: required non-empty array when `service_rates` is present.
- `service_rates.rates[].name`: string, 3 to 100 characters.
- `service_rates.rates[].description`: string, max 250 characters.
- `service_rates.rates[].amount`: positive integer, minimum 1, no decimals.
- `status`: `draft` or `published`.
- `access_type`: optional `public` or `private`.
- `access_code`: exactly 6 alphanumeric characters when allowed.

## Business Errors

Business-rule errors use this shape:

```json
{
  "status": "error",
  "message": "Clear human-readable message",
  "code": "ERROR_CODE"
}
```

Implemented custom codes:

```text
SL02  400  Slug is already taken
AC01  400  access_code is required when access_type is private
AC05  400  access_code can only be set on private cards
NF01  404  Creator card not found
NF02  404  Creator card not found
AC03  403  This card is private. An access code is required
AC04  403  Invalid access code
```

## Quick Smoke Tests

Missing card:

```bash
curl -s https://creator-mania-2492ff6a2e03.herokuapp.com/creator-cards/does-not-exist-123
```

Expected response:

```json
{
  "message": "Creator card not found",
  "status": "error",
  "code": "NF01"
}
```

Create a public card with a unique smoke-test slug:

```bash
SLUG="smoke-test-$(date +%s)"

curl -s -X POST https://creator-mania-2492ff6a2e03.herokuapp.com/creator-cards \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Smoke Test Card\",
    \"slug\": \"$SLUG\",
    \"creator_reference\": \"crt_8f2k1m9x4p7w3q5z\",
    \"status\": \"published\"
  }"
```
