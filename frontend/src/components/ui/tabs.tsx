// Adapted from shadcn / Tabs, 21st.dev demo 953. Radix retains keyboard and ARIA behavior.
import * as React from "react";
import * as Primitive from "@radix-ui/react-tabs";
export const Tabs = Primitive.Root;
export const TabsList = React.forwardRef<
  React.ComponentRef<typeof Primitive.List>,
  React.ComponentPropsWithoutRef<typeof Primitive.List>
>(({ className = "", ...props }, ref) => (
  <Primitive.List ref={ref} className={`tabs-list ${className}`} {...props} />
));
export const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof Primitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof Primitive.Trigger>
>(({ className = "", ...props }, ref) => (
  <Primitive.Trigger
    ref={ref}
    className={`tabs-trigger ${className}`}
    {...props}
  />
));
export const TabsContent = React.forwardRef<
  React.ComponentRef<typeof Primitive.Content>,
  React.ComponentPropsWithoutRef<typeof Primitive.Content>
>(({ className = "", ...props }, ref) => (
  <Primitive.Content
    ref={ref}
    className={`tabs-content ${className}`}
    {...props}
  />
));
TabsList.displayName = "TabsList";
TabsTrigger.displayName = "TabsTrigger";
TabsContent.displayName = "TabsContent";
