# Scholark Code Review — Bugs and Code Smells

Review date: 2026-07-02. Scope: entire repository (FastAPI backend, React Router frontend, Alembic migrations, Docker/compose/justfile).

Findings marked **[verified]** were reproduced with a runnable script against the same sqlmodel/pydantic/SQLAlchemy stack; the rest are from code reading.

---

## 1. Critical bugs

### 1.1 `.one()` makes every "not found" branch dead code — missing rows return 500, not 404 **[verified]**

`Result.one()` raises `NoResultFound` when there is no row, so every `if not conference: raise HTTPException(404)` after it is unreachable. Requesting a nonexistent conference (or a tag not owned by the caller) produces an unhandled exception and a 500 response.

Affected sites in `backend/src/scholark/api/routes/conferences.py`:

- `read_conference` (lines 98–100)
- `delete_conference` (120–122)
- `update_conference` (137–139)
- `add_tag_to_conference` (173–175) — also triggers when the tag exists but belongs to another user, since the query filters by `user_id`
- `remove_tag_from_conference` (197–199)
- `update_tags_for_conference` (218–220, 230–232, 238–240)

Fix: use `session.get(Conference, conference_id)` or `.first()` and keep the 404 checks.

### 1.2 Deleting a user 500s the conference list for everyone **[verified]**

`Conference.created_by_user_id` is nullable with `ondelete="SET NULL"` (`models.py:117`, migration `20250426_090133`), but `ConferencePublic.created_by_user_id` is declared as a non-optional `uuid.UUID` (`models.py:128`). Once a user who created any conference is deleted (`DELETE /users/{user_id}`), that conference has `created_by_user_id = NULL`, and every subsequent `GET /conferences/` and `GET /conferences/{id}` fails response validation with a 500 — for all users, permanently, until the data is fixed.

Fix: `created_by_user_id: uuid.UUID | None` in `ConferencePublic`.

### 1.3 In-place tag filtering issues real `DELETE`s on the association table **[verified]**

`read_conferences` and `read_conference` filter tags for presentation by mutating the ORM relationship:

```python
conference.tags = [tag for tag in conference.tags if tag.user_id == current_user.id]
```

(`conferences.py:49, 103`). SQLAlchemy treats this as a pending change; the next autoflush (triggered by the lazy load of `conference.subscribers` inside `_conference_to_public`, line 29) emits `DELETE FROM tagconferencelink ...` for every other user's tag link. I reproduced this: after the filter plus one lazy load, the link rows are gone within the transaction.

Today the data survives only because these GET handlers never commit, so the session rollback on close restores the rows. This is one added `session.commit()` (or a future refactor) away from silently destroying every other user's tag assignments on a read, and it already sends spurious DELETEs and takes row locks on every list request.

Fix: never mutate the relationship for filtering — filter when building `ConferencePublic` (e.g. construct `TagPublic` list from a filtered comprehension into the response model, not the ORM object).

### 1.4 Personal tags of all users leak through write endpoints

`update_conference`, `add_tag_to_conference`, `remove_tag_from_conference`, `update_tags_for_conference`, and `delete_conference` return the raw `Conference` through `response_model=ConferencePublic` *without* filtering `tags` by the current user (`conferences.py:128–246`). The serialized response includes every user's personal tags (name, color, `user_id`) attached to that conference — data the read endpoints deliberately filter out. `is_subscribed` is also always `false` in these responses.

Fix: route all responses through `_conference_to_public` (with the tag filter applied) instead of returning ORM objects.

### 1.5 JWT secret regenerates on every restart; never configurable in deployment

`SECRET_KEY: str = secrets.token_urlsafe(32)` (`core/config.py:23`) generates a fresh secret each process start, and nothing sets `SCHOLARK_SECRET_KEY`: it's absent from `compose.yaml`'s backend environment, `.env`, and both `.env.*` files. Consequences:

- Every backend restart/redeploy invalidates all issued tokens (users silently logged out — and due to frontend bug 3.1 they land on an error page, not the login page).
- If the server ever runs with multiple workers/replicas, each process has a different secret and authentication breaks randomly per request.

Fix: make `SECRET_KEY` a required setting (no default) and wire `SCHOLARK_SECRET_KEY` through compose.

### 1.6 `User.disabled` is never enforced

`User.disabled` exists (`models.py:162`) but is checked nowhere: not in `get_current_user` (`api/deps.py:32–52`), not in `DbAuthProvider.authenticate`, not in `LdapAuthProvider.authenticate`. Disabling a user has no effect — they can keep logging in and using the API indefinitely. (`User.role` at `models.py:163` is likewise written but never read.)

---

## 2. Backend bugs and security concerns

### 2.1 LDAP: DN injection and unhandled empty-password path

`LdapAuthProvider.authenticate` builds the bind DN with `self.dn_pattern.format(username=username)` (`ldap_provider.py:27`) without escaping. A username containing DN metacharacters (`,`, `=`, `+`, …) alters the DN structure. Use `ldap3.utils.dn.escape_rdn`.

Also, an empty password (the OAuth2 form accepts `password=""`) makes `ldap3` raise `LDAPPasswordIsMandatoryError` at bind — an unhandled exception → 500. On LDAP servers configured to permit unauthenticated binds this exact pattern is a classic authentication bypass; guard explicitly with `if not password: return None`.

Additionally, `compose.yaml` passes `SCHOLARK_LDAP_DN_PATTERN` but **not** `SCHOLARK_LDAP_SERVER` (line 49), so `AUTH_PROVIDER=ldap` under compose fails the `assert settings.LDAP_SERVER is not None` in `get_auth_provider` (`deps.py:72`) — a 500 on every login. Those `assert`s also disappear under `python -O`; raise a real error instead.

### 2.2 User creation is non-atomic — can strand an unloginable username

`DbAuthProvider.create_user` (`db_provider.py:16–52`) commits the `User` row, then separately commits the `DbAuthCredential`. If the second commit fails, a `User` without credentials persists: that username is now permanently taken ("User already exists") but can never authenticate. Do both inserts in one transaction.

### 2.3 `read_user_by_id` returns 500 for a missing user

`users.py:91–106`: when `session.get` returns `None` and the caller is a superuser, the handler returns `None` through `response_model=UserPublic` → `ResponseValidationError` (500). A non-superuser gets 403 instead of 404. Add an explicit `if user is None: raise HTTPException(404)`.

### 2.4 CORS is configured but never enabled

`Settings.all_cors_origins` (`core/config.py:31`) and `SCHOLARK_BACKEND_CORS_ORIGINS` plumbing exist, but `main.py` never adds `CORSMiddleware`. It works today only because the React Router server makes all API calls server-side. Either add the middleware or delete the dead config.

### 2.5 `update_conference`: fragile field-set manipulation **[verified]**

`conferences.py:141–143` assigns `conference_in.milestones = None` and then calls `model_dump(exclude_unset=True)`. Assignment marks the field as *set*, so `update_dict` contains `"milestones": None`; it only avoids clobbering the relationship because `sqlmodel_update` happens to ignore non-field keys. Pop the key from the dict instead of relying on that. Also note the PUT deletes and recreates all milestones on every edit (new IDs each time — see 3.5), and `updated_at` is bumped even when nothing changed.

### 2.6 Smaller backend issues

- `lifespan` (`main.py:36–39`) calls `logger.exception` four times — three are advisory messages that each print a full traceback — and references `SCHOLARK_DB_AUTO_MIGRATE`, which is a `startup.sh` variable the app never reads.
- `create_user` / `register_user` (`users.py:50, 85`) say "user with this email" — the field is a username.
- `get_current_user` returns 404 "User not found" for a valid token whose user was deleted; 401 is the conventional status, and 403 for the invalid-token case should arguably be 401 with `WWW-Authenticate`.
- `skip`/`limit` query params are unclamped (`limit=10**9` or negative values are accepted).
- `notify_new_conference` runs a blocking Slack HTTP call inside the request handler (`conferences.py:84`); a slow Slack API delays conference creation. Consider FastAPI `BackgroundTasks`.
- `DbAuthProvider.authenticate` returns early when the username doesn't exist — response-time difference allows username enumeration; hash a dummy password in that branch.
- `send_milestone_reminders` computes "today" in UTC (`slack.py:73`); for users west of UTC the 7/30-day reminders arrive a day early relative to their local calendar.
- `Tag.color` / `TagCreate.color` is an unvalidated `str`; the API accepts any value (see frontend crash 3.2). Validate `^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$` server-side.
- `ConferencePublic.tags: list[TagPublic] = Field(default=None)` (`models.py:130`) — a `None` default on a non-optional list type; only unexercised because validation always supplies the attribute.
- `startup.sh:16` checks `$?` after `alembic upgrade head` under `set -e` — the check is dead code.
- Returning the just-deleted ORM instance from `delete_conference`/`delete_tag` works only while the needed attributes happen to be loaded pre-flush; return a `Message` or serialize before deleting.

---

## 3. Frontend bugs

### 3.1 Expired token shows an error page instead of the login page

The session cookie lives 1 year (`sessions.server.ts:29`), the JWT 7 days (`ACCESS_TOKEN_EXPIRE`, `core/config.py:24`). Loaders only check `session.has("accessToken")`; when the backend rejects the stale token, every loader throws a generic 500 (`conferences.tsx:43–52`, `timeline.tsx`, `settings.tsx`). After a week of inactivity users are stuck on "Error fetching conferences" with no path back to login other than manually finding /logout. Detect 401/403 from the API, destroy the session, and redirect to `/login`.

### 3.2 One malformed tag color crashes whole pages

`pickLabelTextColor` throws on anything that isn't 3/6-digit hex (`lib/color.ts:59–61`) and is called during render in `conferences.tsx`, `timeline.tsx`, and `settings.tsx`. The backend accepts any string as a tag color (2.6), so a single tag created via the API with `"red"` takes down those routes (error boundary) for that user. Make it return a fallback instead of throwing, and validate server-side.

### 3.3 Date handling mixes UTC parsing with local-time math

- `timeline.tsx:84` — `formatDate` **mutates** `item.date` (`date.setHours(0,0,0,0)`) during render; afterwards `isPast`/`isAllPast` comparisons (lines 222, 227) operate on mutated values, and results differ before/after the first render pass.
- `new Date("YYYY-MM-DD")` parses as UTC midnight, then `setHours(0,0,0,0)` applies local time (`conferences.tsx:62–63, 95–96`; `timeline.tsx`): in negative-UTC-offset timezones dates shift back a day, so conferences appear "past" a day early and deadline urgency is off by one.
- `diffDays` uses `Math.ceil` in `conferences.tsx:98` but `Math.floor` in `timeline.tsx:86` — inconsistent day counts for the same milestone.

### 3.4 Write actions ignore API errors

`create-conference.tsx:53`, `edit-conference.tsx:66`, and `delete-conference.tsx:15` `await` the API call without checking `error`, then redirect. If the save fails (validation, expired token, 500), the user is silently returned to the list believing it succeeded.

### 3.5 Editing a conference silently discards milestone times (and rewrites all milestones)

The backend model supports an optional `time` per milestone (`models.py:68`), but the edit form only submits `name` and `date` (`edit-conference.tsx:47–56`), and the PUT handler deletes and recreates all milestones. Any milestone time set through the API is lost on the next edit by anyone, milestone IDs churn on every save, and two users editing concurrently clobber each other (last write wins with no conflict detection).

### 3.6 Login can commit a broken session

`login.tsx:47–60`: `session.set("accessToken", …)` happens *before* the `test-token` verification. On test-token failure the code flashes an error and redirects to `/login` — but `commitSession` persists the token, and the `/login` loader sees `accessToken` and immediately redirects to `/conferences`, which then errors. Set the token only after verification succeeds (or `session.unset` it in the failure branch).

### 3.7 Smaller frontend issues

- `register.tsx:39–43` — the second error return puts `status: 400` **inside** the data payload instead of the `ResponseInit`, so the response is a 200.
- `root.tsx:63–70` and `layouts/main.tsx:36–44` render `error.stack` unconditionally — stack traces are exposed in production (the RR template gates this behind `import.meta.env.DEV`).
- `conferences.tsx:160,164` — `area-hidden` should be `aria-hidden`.
- `conferences.tsx:175` — `.sort()` mutates loader data during render; use `toSorted()`. Milestone list keys use `name-date` instead of the available `milestone.id`.
- No pagination anywhere: the backend defaults to `limit=100`, and the frontend never passes paging params, so the 101st conference/tag silently disappears while `count` still reports the true total.
- `edit-tag.tsx:17` says "Conference not found" for a tag; `create-tag.tsx:42` says "Tag not found" for a create failure — copy-paste error messages.
- `login.tsx:84` / `register.tsx:61` — `type="username"` is not a valid input type (should be `text` with `autoComplete="username"`).
- `timeline.tsx:59–67` — the `action` is dead code (reads a form value, returns nothing).
- `conference-tags.tsx:14` — `JSON.parse` of client-supplied form data without try/catch; malformed data crashes the action with a 500.
- Empty conference names are allowed: the "" → null cleanup deliberately skips `name` (`create-conference.tsx:22`), and neither backend nor form enforces non-empty, so a conference can be created/renamed to an empty string. (`updates.name ?? "New Conference"` only catches *missing*, not empty.)
- `layouts/main-frame.tsx:65` — `AvatarImage src="/path/to/avatar.jpg"` is a leftover placeholder requesting a nonexistent asset on every page.

---

## 4. Repository-level smells

- **No tests at all** — neither backend (no pytest, no test deps) nor frontend (no Vitest specs), while CI only lints. Every bug above would have to be caught by hand.
- `.env` with credentials (`SCHOLARK_POSTGRES_PASSWORD=password`, `SCHOLARK_FIRST_SUPERUSER_PASSWORD=password`, `SCHOLARK_SESSION_SECRET="secret"`) is committed to the repository. They look like local-dev values, but committed `.env` files invite real secrets to follow; prefer a committed `.env.example` and an ignored `.env`.
- Duplicated milestone form-parsing logic between `create-conference.tsx` and `edit-conference.tsx` (~40 identical lines) — extract a shared helper.
- Duplicated auth boilerplate: every loader/action repeats the `getSession` → `has("accessToken")` → redirect dance and manual `Authorization` header construction; a small `requireSession(request)` helper would remove ~15 copies.
- `AuthProvider` abstract methods both use `@abstractmethod` *and* raise `NotImplementedError` with an unused message (`auth/base.py`); `AuthProviderError` subclasses FastAPI's `HTTPException`, coupling the auth layer to the web framework.
- `users.py:99` / `users.py:119` compare ORM instances with `==` where comparing `user.id` is the intent — works via pydantic value equality but is fragile.
- Commented-out dead code left in place: `create-tag.tsx:7–20`, `delete-tag.tsx:6–19`, `users.py:124–125`, `settings.tsx:103`.

---

## 5. Suggested fix priority

1. 1.2 (`created_by_user_id` nullability) and 1.1 (`.one()` → 404s) — user-visible 500s reachable today.
2. 1.3 (relationship mutation) — latent data loss, one commit away.
3. 1.5 (secret key) + 3.1 (expired-token UX) — every restart currently strands all logged-in users on an error page.
4. 1.4 (tag leak), 1.6 (`disabled` unenforced), 2.1 (LDAP) — access control and privacy.
5. 3.2/2.6 (color validation), 3.4 (unchecked write errors), 2.2 (non-atomic user creation).
6. Everything else opportunistically; add a test suite before refactoring.
