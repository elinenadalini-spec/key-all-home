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
- Access control lives in RLS (owner / authorized approved agent / admin via has_role & agent_has_access); UI queries the browser client directly. Why: one source of truth for permissions.
- Property photos are in a private bucket under `<owner_id>/<property_id>/...` and shown via signed URLs. Why: workspace blocks public buckets and agents must only see authorized properties.
- The first account ever created gets the admin role (handle_new_user trigger). Why: bootstraps the portfolio manager without manual SQL.
- Agent "network" visibility (owner contacts, other properties' cover photo) is exposed only via security-definer RPCs (agent_owner_contacts, agent_network_properties) gated by agent_connected_to_owner; full property access still requires an authorizations row. Why: agents must never read unauthorized property rows directly.
- Intermediation term text lives in app_terms (admin-editable) with code defaults in src/lib/terms.ts as fallback. Why: works before the admin saves any text.
