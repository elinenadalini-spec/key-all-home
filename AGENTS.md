<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Structured property amenities and room/garage counts are persisted in properties through the existing atomic change RPC and shown read-only to authorized viewers; descriptions remain separate. Why: preserve searchable structured information, ownership restrictions and auditing.
- Access control lives in RLS (owner / authorized approved agent / admin via has_role & agent_has_access); UI queries the browser client directly. Why: one source of truth for permissions.
- Inventory owner filtering applies only to non-admin owners; administrators read the full RLS-visible inventory even when they also hold the owner role. Why: administrators must see properties linked to other owners without transferring ownership.
- Property photos are in a private bucket under `<owner_id>/<property_id>/...` and shown via signed URLs. Why: workspace blocks public buckets and agents must only see authorized properties.
- The first account ever created gets the admin role (handle_new_user trigger). Why: bootstraps the portfolio manager without manual SQL.
- Agent "network" visibility (owner contacts, other properties' cover photo) is exposed only via security-definer RPCs (agent_owner_contacts, agent_network_properties) gated by agent_connected_to_owner; full property access still requires an authorizations row. Why: agents must never read unauthorized property rows directly.
- Intermediation term text lives in app_terms (admin-editable) with code defaults in src/lib/terms.ts as fallback. Why: works before the admin saves any text.
- Property changes from the UI use an authenticated server function, owner verification, and a service-only atomic database RPC; RLS still controls reads and direct writes are audited with unavailable IP when absent. Why: capture edge-observed IP and persist immutable history plus authorized-recipient internal notifications together.
- Property segment selects filter both authorized inventory and limited network-cover RPC results; existing properties default to the original segment. Why: preserve per-property authorization across categories.
- Internal notification delivery is a durable inbox insert, with per-authorization opt-out and recipient read acknowledgements; IP-bearing history is owner-only. Why: avoid exposing audit IPs or describing inbox persistence as email delivery.
- Calendar edits use the shared calendarDayChange helper and include the stored note in each day payload. Why: blocking dates or changing prices must not erase unrelated observations.
- The Cadastro owner directory combines RLS-visible profiles with admin-only directory contacts; demo contacts are not auth accounts. Why: show searchable examples without granting access or exposing unrelated owners to agents.
