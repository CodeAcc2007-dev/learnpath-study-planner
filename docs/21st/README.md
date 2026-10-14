# Retrieved 21st.dev components

Retrieved full component source and usage demos through the signed-in 21st.dev connector on 2026-09-21 before implementation. The adjacent TSX files preserve the original retrieved component source; application adaptations live in `frontend/src/components/ui/`.

| Component | Demo ID | Source | Adaptation |
| --- | --- | --- | --- |
| Sidebar Light by inference-sh | 19361 | https://21st.dev/@inference-sh/components/sidebar-light | Recursive navigation, icons, active-state highlighting. Replaced Tailwind utilities with the app CSS, passed the current hash route explicitly, added course count and aria-current. |
| Tabs by shadcn | 953 | https://21st.dev/@shadcn/components/tabs | Retained Radix primitives, forwarded refs, keyboard navigation, and panel semantics; used underline tabs for course filters and lesson resources. |
| Dialog by shadcn | 1248 | https://21st.dev/@shadcn/components/dialog | Retained Radix portal, overlay, focus trap, title, description, close and Escape behavior. Added busy-state dismissal protection and focus restoration. |

The app remains React, Vite, and ordinary CSS. Added only `@radix-ui/react-tabs` and `@radix-ui/react-dialog`; no Tailwind or animation framework required. Course illustrations are lightweight inline SVG diagrams.
