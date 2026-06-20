interface LogoProps {
  className?: string;
  withWordmark?: boolean;
}

/** Poke Hanoi brand mark — a poke bowl with chopsticks + a salmon-coral topping. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Poke Hanoi"
      fill="none"
    >
      {/* chopsticks */}
      <path
        d="M31 7 L41 20 M36 5 L45 17"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* bowl */}
      <path
        d="M5 21 H43 A19 19 0 0 1 5 21 Z"
        fill="currentColor"
      />
      {/* bowl rim highlight */}
      <path
        d="M5 21 H43"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* toppings on the rim */}
      <circle cx="14" cy="18.5" r="3" fill="#FB6B4C" />
      <circle cx="22" cy="17.5" r="3" fill="#33A192" />
      <circle cx="30" cy="18" r="3" fill="#FCD34D" />
    </svg>
  );
}

export default function Logo({ className = "", withWordmark = true }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 text-brand-600 ${className}`}>
      <LogoMark className="h-7 w-7" />
      {withWordmark && (
        <span className="text-xl font-extrabold tracking-tight text-brand-700">
          Poke Hanoi
        </span>
      )}
    </span>
  );
}
