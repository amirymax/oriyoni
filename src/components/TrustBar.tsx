"use client";

import { RefreshIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import { useLanguage } from "@/context/LanguageContext";

export function TrustBar() {
  const { t } = useLanguage();

  const items = [
    { icon: TruckIcon, title: t.trustShippingTitle, copy: t.trustShippingCopy },
    { icon: RefreshIcon, title: t.trustReturnsTitle, copy: t.trustReturnsCopy },
    { icon: ShieldIcon, title: t.trustSecureTitle, copy: t.trustSecureCopy },
  ];

  return (
    <section className="border-y border-line bg-white">
      <div className="container-shell grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((item) => (
          <div key={item.title} className="flex items-center gap-4 py-8 sm:justify-center">
            <item.icon className="h-6 w-6 shrink-0 text-ink" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <p className="text-xs text-ash">{item.copy}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
