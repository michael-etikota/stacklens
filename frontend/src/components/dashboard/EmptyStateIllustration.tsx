import { motion } from "framer-motion";

export function NotConnectedIllustration({ className }: { className?: string }) {
  return (
    <motion.svg
      width="160"
      height="160"
      viewBox="0 0 160 160"
      fill="none"
      className={className}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background circle */}
      <circle cx="80" cy="80" r="70" fill="hsl(var(--primary) / 0.06)" />
      <circle cx="80" cy="80" r="50" fill="hsl(var(--primary) / 0.08)" />

      {/* Wallet body */}
      <rect x="42" y="55" width="76" height="50" rx="8" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth="2" />
      {/* Wallet flap */}
      <path d="M42 63C42 58.5817 45.5817 55 50 55H110V70H50C45.5817 70 42 66.4183 42 62V63Z" fill="hsl(var(--primary) / 0.25)" stroke="hsl(var(--primary))" strokeWidth="2" />
      {/* Clasp */}
      <circle cx="108" cy="80" r="6" fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <circle cx="108" cy="80" r="2.5" fill="hsl(var(--primary))" />

      {/* Connection dots */}
      <motion.circle
        cx="32" cy="80" r="3"
        fill="hsl(var(--muted-foreground) / 0.4)"
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.circle
        cx="22" cy="80" r="2"
        fill="hsl(var(--muted-foreground) / 0.3)"
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
      />
      <motion.circle
        cx="14" cy="80" r="1.5"
        fill="hsl(var(--muted-foreground) / 0.2)"
        animate={{ opacity: [0.1, 0.4, 0.1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
      />

      {/* Floating STX icon */}
      <motion.g
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="80" cy="38" r="12" fill="hsl(var(--accent) / 0.15)" stroke="hsl(var(--accent))" strokeWidth="1.5" />
        <text x="80" y="42" textAnchor="middle" fill="hsl(var(--accent))" fontSize="12" fontWeight="700" fontFamily="Inter, sans-serif">S</text>
      </motion.g>
    </motion.svg>
  );
}

export function NotStackingIllustration({ className }: { className?: string }) {
  return (
    <motion.svg
      width="160"
      height="160"
      viewBox="0 0 160 160"
      fill="none"
      className={className}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background circle */}
      <circle cx="80" cy="80" r="70" fill="hsl(var(--accent) / 0.06)" />
      <circle cx="80" cy="80" r="50" fill="hsl(var(--accent) / 0.08)" />

      {/* Stacking layers */}
      <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
        <ellipse cx="80" cy="95" rx="35" ry="10" fill="hsl(var(--primary) / 0.12)" stroke="hsl(var(--primary) / 0.4)" strokeWidth="1.5" strokeDasharray="4 3" />
      </motion.g>
      <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}>
        <ellipse cx="80" cy="82" rx="35" ry="10" fill="hsl(var(--primary) / 0.18)" stroke="hsl(var(--primary) / 0.5)" strokeWidth="1.5" strokeDasharray="4 3" />
      </motion.g>
      <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}>
        <ellipse cx="80" cy="69" rx="35" ry="10" fill="hsl(var(--primary) / 0.25)" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      </motion.g>

      {/* Arrow up */}
      <motion.g
        animate={{ y: [0, -5, 0], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M80 52L86 58H74L80 52Z" fill="hsl(var(--accent))" />
        <line x1="80" y1="58" x2="80" y2="48" stroke="hsl(var(--accent))" strokeWidth="2" strokeLinecap="round" />
      </motion.g>

      {/* BTC reward icon */}
      <motion.g
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <circle cx="120" cy="50" r="14" fill="hsl(var(--accent) / 0.15)" stroke="hsl(var(--accent))" strokeWidth="1.5" />
        <text x="120" y="55" textAnchor="middle" fill="hsl(var(--accent))" fontSize="14" fontWeight="700" fontFamily="Inter, sans-serif">₿</text>
      </motion.g>
    </motion.svg>
  );
}
