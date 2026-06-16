# Architecture & Implementation Documentation

This document explains the specific architecture implemented for the **Creator Cards Microservice**. The application uses a custom Node.js framework pattern where core framework responsibilities are separated from the business domain.

## Project Structure (`@app-core` vs `@app`)

### `@app-core` (The Framework)
The `core/` folder represents the underlying microservice framework. You typically do not modify these files unless extending framework capabilities (such as attaching the custom `error.errorCode` to the global express responder).
- **express**: Handles the global `createHandler` wrapper, standardizing all HTTP responses and middleware execution.
- **validator-vsl**: A custom Validation Specification Language parser used to validate incoming JSON payloads strictly based on object shapes.
- **mongoose**: Standardizes Mongoose connections, ULID ID generation, and model schemas.
- **errors**: Maps internal error mappings (like `throwAppError`) into HTTP response codes.

### `@app` (The Business Logic)
The rest of the folders (`endpoints`, `services`, `models`, `messages`, `repository`) define the application logic for the Creator Cards API.

---

## How Data Flows

1. **Endpoint Wrapper (`endpoints/creator-cards/create.js`)**
   The endpoint uses `createHandler` from `@app-core/server`. It strips out the necessary payload parameters and calls the respective service function.

2. **Service Validation (`services/creator-cards/create.js`)**
   The service uses `validator-vsl` to parse and assert the request payload against a `spec` template:
   ```javascript
   const spec = `root {
     title string<minLength:3|maxLength:100>
     creator_reference string<length:20>
     // ...
   }`;
   const parsedSpec = validator.parse(spec);
   const data = validator.validate(serviceData, parsedSpec);
   ```

3. **Business Logic & Error Throwing**
   If the business rules fail (e.g. missing an access code on a private card), the service throws a specific app error pulling from the `messages/creator-cards.js` dictionary:
   ```javascript
   if (data.access_type === 'private' && !data.access_code) {
     throwAppError(CreatorCardsMessages.PRIVATE_ACCESS_CODE_REQUIRED, 'AC01');
   }
   ```

4. **Database Operations (`models/creator-card.js`)**
   If the validation succeeds, the service calls the generic `repository/creator-cards` layer, which delegates to the custom Mongoose schema (enforcing standard fields like `created`, `updated`, and mapping `_id` to a ULID).

5. **Response Formatting**
   The Mongoose object is mapped explicitly to strip internal references (like replacing `_id` with `id`, and omitting empty optionals) before returning to the user via the `createHandler` global HTTP responder.

---

## Business Rule Mapping

In order to meet assessment criteria, specific error codes are registered inside `core/errors/constants.js` to ensure the server automatically translates them to proper HTTP codes:

```javascript
  SL02: 400,
  AC01: 400,
  AC05: 400,
  NF01: 404,
  NF02: 404,
  AC03: 403,
  AC04: 403,
```

By adding these into `ERROR_STATUS_CODE_MAPPING`, `throwAppError(msg, 'AC03')` natively tells the `@app-core/server` to yield an HTTP 403 status code while attaching `"code": "AC03"` in the final JSON body.
