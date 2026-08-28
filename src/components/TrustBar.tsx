import { RefreshIcon, ShieldIcon, TruckIcon } from "@/components/icons";

const ITEMS = [
  {
    icon: TruckIcon,
    title: "Free Shipping",
    copy: "On all orders over $120",
  },
  {
    icon: RefreshIcon,
    title: "Easy 30-Day Returns",
    copy: "Didn't fit? Send it back",
  },
  {
    icon: ShieldIcon,
    title: "Secure Checkout",
    copy: "Encrypted end to end",
  },
];

export function TrustBar() {
  return (
    <section className="border-y border-line bg-white">
      <div className="container-shell grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex items-center gap-4 py-8 sm:justify-center">
            <item.icon className="h-6 w-6 shrink-0 text-ink" />
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
