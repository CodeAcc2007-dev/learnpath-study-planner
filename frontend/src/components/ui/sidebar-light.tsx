// Adapted from inference-sh / Sidebar Light, 21st.dev demo 19361.
import type { ComponentType } from "react";
export interface NavItem {
  title: string;
  href: string;
  icon?: ComponentType<{ className?: string }>;
  count?: number;
  items?: NavItem[];
}
function NavItemRenderer({
  item,
  activeHref,
  depth,
}: {
  item: NavItem;
  activeHref: string;
  depth: number;
}) {
  if (item.items?.length)
    return (
      <div className="nav-group">
        <div className="nav-group-title">{item.title}</div>
        <div className="nav-children">
          {item.items.map((child) => (
            <NavItemRenderer
              key={child.href}
              item={child}
              activeHref={activeHref}
              depth={depth + 1}
            />
          ))}
        </div>
      </div>
    );
  return (
    <a
      href={item.href}
      className={`nav-item ${activeHref === item.href ? "active" : ""} ${depth ? "nested" : ""}`}
      aria-current={activeHref === item.href ? "page" : undefined}
    >
      {item.icon && <item.icon className="nav-icon" />}
      <span>{item.title}</span>
      {item.count !== undefined && (
        <span className="nav-count">{item.count}</span>
      )}
    </a>
  );
}
export function SidebarLight({
  items,
  activeHref,
}: {
  items: NavItem[];
  activeHref: string;
}) {
  return (
    <nav aria-label="Main navigation">
      {items.map((item) => (
        <NavItemRenderer
          key={item.href}
          item={item}
          activeHref={activeHref}
          depth={0}
        />
      ))}
    </nav>
  );
}
