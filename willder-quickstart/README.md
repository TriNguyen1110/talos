# Willder: check the access control yourself

[Willder](https://willder.ai) is shared memory for AI agents. Each agent holds its own
scoped, expiring token, and revoking a token refuses its next call. This folder lets you
check both claims against the hosted service in about ten minutes, with nothing but Node.

Two scripts, no dependencies, no install step:

- `leak-check.mjs` writes a random canary fact with a token for one scope, and checks that
  a token for a sibling scope cannot find it, while the first token can (so a check that
  hides everything fails too). It also checks that no token, a made-up token, and a write
  from a read-only token are all refused.
- `revoke-check.mjs` checks that a token works, waits while you revoke it in the app, then
  checks that its very next call is refused.

They talk only to `https://willder.ai/api/mcp`. They read tokens from environment
variables and never print them. Willder's source is not public, so this suite
tests the running service from the outside, the way any client sees it.

## 1. Get the scripts

You need Node 20 or newer (`node --version`) and git.

```bash
git clone --depth 1 https://github.com/TriNguyen1110/talos.git
cd talos/willder-quickstart
```

## 2. Make two scopes and three tokens in the app

Sign up at [willder.ai/sign-up](https://willder.ai/sign-up). If signing in leaves you on
the sign-in form, open [willder.ai/access](https://willder.ai/access) yourself.

**Scopes.** In **Access → Scopes**, type `Leak A` as **Scope name**, leave **Parent scope**
on `Org root`, and choose **Create scope**. Do the same for `Leak B`. Both must sit
directly under `Org root`, side by side: a token on a parent scope reads its children, so
nesting them would make the check meaningless.

**Tokens.** In **Access → Tokens → Issue token**, issue three. For **Agent**, choose
**Other client** and type the **Client ID** shown. **Scope** is a tree picker that starts
on `Org root`: open it, type the scope name in **Search scopes** and pick it. Leaving it on
`Org root` gives the token every scope, and the leak check then fails, correctly.

| Client ID | Scope | Permission | TTL (hours) | Goes in |
|---|---|---|---|---|
| `leak_writer` | `Leak A` | `write` | `1` | `LEAK_TOKEN_A` |
| `leak_reader` | `Leak B` | `read` | `1` | `LEAK_TOKEN_B` |
| `revoke_probe` | `Leak B` | `read` | `1` | `WILLDER_TOKEN` |

Each token (`wcap_...`) is shown once. Paste it straight into the terminal you will run
the scripts from, with the input hidden, so it never lands in a file or your history:

```bash
for v in LEAK_TOKEN_A LEAK_TOKEN_B WILLDER_TOKEN; do
  printf '%s: ' "$v"; stty -echo; read -r "$v"; stty echo; printf '\n'; export "$v"
done
```

That loop is for bash or zsh. Paste each token when its name appears, then press Enter.

## 3. Run the leak check

```bash
node leak-check.mjs
```

Expected, in a few seconds (the canary differs every run):

```
Endpoint: https://willder.ai/api/mcp
Canary:   leak-canary-<random id>

PASS  a call with no token is refused  (HTTP 401)
PASS  a made-up token is refused  (HTTP 401)
PASS  token A is accepted  (HTTP 200, <n> tools)
PASS  token B is accepted  (HTTP 200, <n> tools)
PASS  token A writes the canary in scope A  (Stored and readable now; ...)
PASS  token A reads the canary back (positive control)
PASS  token B's search does not return the canary  (No facts found.)
PASS  token B's change feed does not mention the canary  (HTTP 200)
SKIP  token B naming scope A explicitly (set LEAK_SCOPE_A to run it)
PASS  token B (read-only) cannot write  (...)

All checks passed.
```

It exits 0 when everything passes and 1 when anything fails. To also try naming scope A
from token B's side, copy scope A's path from **Access → Scopes** and run
`LEAK_SCOPE_A='<that path>' node leak-check.mjs`.

## 4. Revoke a token and see its next call refused

```bash
node revoke-check.mjs
```

It checks that `WILLDER_TOKEN` works, then waits. In **Access → Tokens**, choose `revoke`
on the `revoke_probe` row and `yes` at **Sure?** in the same row. Back in the terminal,
press Enter. Expected:

```
PASS  the token is accepted before revocation  (HTTP 200, <n> tools)
PASS  its next call (tools/list) is refused  (HTTP 401 after <ms> ms: Invalid or unknown capability token.)
PASS  a memory read with it is refused too  (HTTP 401: Invalid or unknown capability token.)

All checks passed.
```

**Access → Audit** shows a `capability.refused` deny row for `revoke_probe`. The token is
refused on its very next call; nothing waits for it to expire. Revoking ends future access;
it cannot recall what the token already read.

## If something fails

- `LEAK_TOKEN_A is not set`: the export did not happen in this terminal. Run the loop in
  step 2 again, in the same window you run the scripts from.
- `token A is accepted` fails with HTTP 401: the token was mistyped, expired (one hour) or
  revoked. Issue a new one.
- `token B's search does not return the canary` fails: check that token B's scope is
  `Leak B` and that `Leak B` is not a parent of `Leak A`. If both are right, that is a real
  leak: please report it (see the last section).
- `token A reads the canary back` fails: token A has `read` instead of `write`, or the
  service is slow. Run the script again; a new canary is used each time.
- `revoke-check` says the token is not accepted now: it was already revoked or expired.
  Issue a new `revoke_probe` token and run it again. The script refuses to test a token it
  has not first seen working, since refusing a dead token proves nothing.
- `Stopping: both tokens must be accepted`: one of the two leak tokens is refused (a typo,
  expired, or revoked). Every later check needs both, so the script stops rather than pass
  them for the wrong reason.

Clean up afterwards: revoke `leak_writer` and `leak_reader` in **Access → Tokens** (they
also expire on their own after an hour). The canary fact stays in `Leak A`.

## Report a problem

Open an issue in this repository with the script's output. The output never contains
a token, so it is safe to paste as is.
