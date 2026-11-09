# n8n-nodes-genaya


> Source of truth: this package is mirrored from the Genaya monorepo folder `developer/integrations-apps/n8n`. Issues and pull requests are welcome here; releases are published to npm from GitHub Actions with provenance when a `v*` tag is pushed.


n8n community nodes for [Genaya](https://genaya.com) over the public API
(`https://api.genaya.com/v1`).

## Nodes

- **Genaya** (declarative): resources `client`, `lead`, `appointment`,
  `invoice`, `task`, `message` with `getMany` / `get` / `create` (message:
  `send`). Lead operations include a lead-table dropdown loaded from
  `GET /v1/lead-tables`.
- **Genaya Trigger** (instant): subscribes via
  `POST /v1/webhook-endpoints { url, events, description: "n8n" }` on
  activation and `DELETE`s the endpoint on deactivation. Emitted items are
  the event's `data.object` merged with `event_id` / `event_type`.
  Payment events (`payment.received`, `payment.refunded`, `payment.failed`)
  carry `company_id` / `company_name`, the company that collected the
  payment (null when it has none).

## Credentials

**Genaya API** - a single API key (`gny_live_...`) created in the Genaya app
under Settings > Developer > API Keys, sent as `Authorization: Bearer`.
Validated against `GET /v1/ping`. Requires the Individual plan or above with a
live key (the free trial issues test keys only, which cannot write);
the trigger node needs the `webhooks:write` scope, and each resource needs
its own read/write scope (keys without scopes have full access).

## Build and publish

```bash
cd developer/integrations-apps/n8n
npm install
npm run build          # tsc -> dist/ + gulp copies the svg icons

# Publish to npm (the package name MUST keep the n8n-nodes- prefix and the
# n8n-community-node-package keyword for n8n to discover it):
npm publish --access public
```

Note: n8n requires verified community nodes to be published via GitHub
Actions with provenance from May 2026 - set that up in the public repo
before submitting for verification (self-hosted installs can use the npm
package either way).

## Install into n8n

- **n8n cloud / desktop**: Settings > Community Nodes > Install >
  `n8n-nodes-genaya`.
- **Self-hosted (docker)**: install into the `~/.n8n/nodes` volume:
  `npm install n8n-nodes-genaya`, then restart n8n.
- **Local development**: `npm run build`, then `npm link` this folder and
  `npm link n8n-nodes-genaya` inside `~/.n8n/nodes` (or set
  `N8N_CUSTOM_EXTENSIONS` to the `dist` parent). Restart n8n; the nodes
  appear under "Genaya".

The instant trigger needs the n8n instance to be reachable from the public
internet (Genaya delivers webhooks over https), so set `WEBHOOK_URL` when
running behind a proxy/tunnel.
