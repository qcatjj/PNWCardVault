const CARDS = [
  { tag: "08/25", title: "Rookie foil", name: "P. Cascade", art: "from-accent to-background", rotate: "-10deg", left: "6%", top: "22%", z: 1 },
  { tag: "1/1", title: "Court light", name: "R. Sound", art: "from-cyan/80 to-background", rotate: "3deg", left: "32%", top: "6%", z: 3 },
  { tag: "41/99", title: "Sunday heat", name: "K. Ridge", art: "from-orange/80 to-background", rotate: "12deg", left: "58%", top: "24%", z: 2 },
];

export function ShowStack() {
  return (
    <div className="relative hidden h-[28rem] w-full overflow-hidden lg:block" aria-hidden>
      {CARDS.map((card) => (
        <div
          key={card.tag}
          className="show-card"
          style={{ left: card.left, top: card.top, transform: `rotate(${card.rotate})`, zIndex: card.z }}
        >
          <span className="show-shine" />
          <div className={`relative flex h-[13.5rem] flex-col justify-end overflow-hidden rounded-[17px] bg-gradient-to-br p-4 ${card.art}`}>
            <p className="absolute top-3 right-3 rounded-lg bg-background/55 px-2 py-1 font-mono text-[10px] font-medium tracking-widest">
              {card.tag}
            </p>
            <div className="absolute top-[18%] left-1/2 flex -translate-x-1/2 flex-col items-center">
              <span className="size-10 rounded-full bg-foreground/85" />
              <span className="mt-0.5 h-16 w-14 rounded-b-lg bg-foreground/85" />
            </div>
            <p className="relative font-display text-3xl leading-none text-foreground/80">{card.title}</p>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{card.title}</p>
              <p className="text-sm font-semibold">{card.name}</p>
            </div>
            <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-[10px] font-medium text-primary">
              GEM
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
