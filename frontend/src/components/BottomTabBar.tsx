"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { CartIcon, HeartIcon, ShopIcon, UserIcon } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useWishlist } from "@/context/WishlistContext";

type Tab = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  badge?: number;
  /** Route prefixes that should light this tab up. */
  match: string[];
};

/**
 * Phone-only tab bar, in the shape of an iOS floating tab bar. Every tab
 * navigates to a real route rather than opening a panel, so each one gets a
 * URL, an active state and predictable back behaviour.
 */
export function BottomTabBar() {
  const pathname = usePathname();
  const { count: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { isSignedIn } = useAuth();
  const { t } = useLanguage();

  const tabs: Tab[] = [
    { href: "/shop", label: t.tabShop, icon: ShopIcon, match: ["/shop", "/product"] },
    { href: "/cart", label: t.tabCart, icon: CartIcon, badge: cartCount, match: ["/cart", "/checkout"] },
    {
      href: "/wishlist",
      label: t.tabWishlist,
      icon: HeartIcon,
      badge: wishlistCount,
      match: ["/wishlist"],
    },
    {
      href: isSignedIn ? "/account" : "/login",
      label: t.tabAccount,
      icon: UserIcon,
      match: ["/account", "/login", "/register", "/forgot-password", "/reset-password"],
    },
  ];

  return (
    <nav aria-label={t.tabBarLabel} className="tab-bar md:hidden">
      <div className="tab-bar-surface mx-auto flex max-w-sm items-stretch gap-1">
        {tabs.map((tab) => {
          const active = tab.match.some(
            (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
          );
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-1 py-2 transition-colors ${
                active ? "bg-ink/[0.07] text-ink" : "text-ash"
              }`}
            >
              <span className="relative">
                <Icon className="h-6 w-6" aria-hidden="true" />
                {tab.badge != null && tab.badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[9px] font-semibold text-white">
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium tracking-[0.02em]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
