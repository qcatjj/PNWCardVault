import { Link } from "@tanstack/react-router";
import { ProductMedia } from "@/components/product-media";
import type { Product } from "@/lib/catalog-types";
import { productName } from "@/lib/catalog-types";
import { formatPrice } from "@/lib/format";

/** Original SVG backdrop: Cascade peaks, foothills, and an evergreen line. */
export function PnwBackdrop() {
  const trees = Array.from({ length: 34 }, (_, i) => {
    const x = i * 30 + (i % 3) * 6;
    const h = 46 + ((i * 37) % 40);
    return `M${x} 400 L${x + 13} ${400 - h} L${x + 26} 400 Z`;
  }).join(" ");
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1000 400"
      preserveAspectRatio="xMidYMax slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        <linearGradient id="pnw-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#0b1016" />
          <stop offset="1" stopColor="#13201a" />
        </linearGradient>
        <linearGradient id="pnw-peak" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#8b5cf6" stopOpacity="0.45" />
          <stop offset="1" stopColor="#8b5cf6" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect width="1000" height="400" fill="url(#pnw-sky)" />
      <circle cx="790" cy="90" r="46" fill="#a6ff3b" opacity="0.12" />
      <path
        d="M0 330 L160 210 L250 260 L420 120 L520 210 L610 170 L760 70 L900 220 L1000 180 L1000 400 L0 400 Z"
        fill="url(#pnw-peak)"
      />
      <path
        d="M720 105 L760 70 L800 108 L780 102 L762 114 L742 100 Z"
        fill="#f7f8fb"
        opacity="0.35"
      />
      <path d="M380 155 L420 120 L455 152 L432 148 L418 160 Z" fill="#f7f8fb" opacity="0.25" />
      <path
        d="M0 360 L120 300 L260 330 L420 280 L600 320 L780 290 L1000 330 L1000 400 L0 400 Z"
        fill="#0f1a14"
      />
      <path d={trees} fill="#0a140e" />
      <path d="M0 398 H1000" stroke="#a6ff3b" strokeOpacity="0.25" />
    </svg>
  );
}

export function PnwHero({ featured }: { featured: Product[] }) {
  return (
    <section className="relative mx-auto mt-4 max-w-6xl overflow-hidden rounded-[26px] border border-border px-5 pt-10 pb-8 sm:px-10 lg:pt-14">
      <PnwBackdrop />
      <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">
            Selah, Washington
          </p>
          <h1 className="mt-3 max-w-xl text-5xl text-foreground md:text-7xl">
            Cards from the Yakima Valley.
          </h1>
          <p className="mt-4 max-w-lg text-base text-muted-foreground md:text-lg">
            Rookies, autos and numbered parallels from a Pacific Northwest collector. Every order
            ships USPS tracked for $6.
          </p>
          <Link
            to="/shop"
            className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-[0_10px_32px_color-mix(in_oklab,var(--color-primary)_20%,transparent)]"
          >
            Shop the cards
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="flex justify-center gap-3 sm:gap-4">
            {featured.map((product, index) => (
              <Link
                key={product.id}
                to="/c/$slug"
                params={{ slug: product.slug }}
                className={
                  "block w-[31%] max-w-44 transition-transform hover:-translate-y-1 " +
                  (index === 1 ? "-translate-y-3" : "translate-y-2")
                }
              >
                <ProductMedia
                  product={product}
                  priority
                  sizes="(min-width: 1024px) 176px, 30vw"
                  className="aspect-[2.5/3.5] rounded-xl border border-border shadow-2xl"
                />
                <p className="mt-2 truncate text-xs font-bold">{productName(product)}</p>
                <p className="text-xs tabular-nums text-primary">
                  {formatPrice(product.priceCents)}
                </p>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
