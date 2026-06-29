import type { GlossaryEntry } from "./types";

// ─────────────────────────────────────────────────────────────────────────
// THE GLOSSARY (§7a + §12c). One shared file — each term defined once,
// the same dotted-underline card appears everywhere a <Term> wraps it.
// ─────────────────────────────────────────────────────────────────────────

export const GLOSSARY: GlossaryEntry[] = [
  // The five steps / layers
  { id: "chips", term: "Chips", group: "The five steps", plain: "The special, powerful computer parts an AI needs to run, like an engine in a car.", why: "Almost nobody makes good ones, so they're the hardest, priciest thing to get (Step 1)." },
  { id: "compute", term: "Compute", group: "The five steps", plain: "A building full of chips plus the electricity to run them.", why: "Even great chips do nothing without a powered building to put them in (Step 2)." },
  { id: "model", term: "Model", group: "The five steps", plain: "The AI itself — the thing that answers questions and does tasks.", why: "You can build one, improve a free one, or rent one (Step 3)." },
  { id: "weights", term: "Weights", group: "The five steps", plain: "The actual AI saved as a giant file. Owning a copy means it's yours forever.", why: "If you own the weights, no one can ever take your AI away (Step 4)." },
  { id: "hosting", term: "Hosting", group: "The five steps", plain: "Where your AI runs and how people reach it.", why: "This is how you actually get users — the thing you're scored on most (Step 5)." },

  // Ways to make a model
  { id: "pre-train", term: "Pre-train", group: "Making a model", plain: "Building an AI from scratch by feeding it huge amounts of text. The big, expensive part.", why: "Most powerful and most independent, but it eats your money and chips." },
  { id: "fine-tune", term: "Fine-tune", group: "Making a model", plain: "Taking a finished free AI and adjusting it for your needs. Quick and cheap.", why: "The smart shortcut — but you need a free AI to start from." },
  { id: "continued-pretraining", term: "Continued pre-training", group: "Making a model", plain: "Training a free AI further to make it noticeably stronger.", why: "A middle path — more powerful than fine-tuning, cheaper than from scratch." },
  { id: "distill", term: "Distill / merge", group: "Making a model", plain: "Making a smaller, cheaper AI by copying from bigger ones.", why: "Clever and cheap, but there's a limit to how good it gets." },

  // Open vs closed
  { id: "open", term: "Open / open-weight", group: "Open vs closed", plain: "An AI whose file is shared publicly — you download it and keep it.", why: "Can't be switched off, and others can build on it for free. The key to staying independent." },
  { id: "closed", term: "Closed / API", group: "Open vs closed", plain: "An AI you can only use by renting access from its owner.", why: "Often the most capable today, but the owner can cut you off anytime — the trap." },
  { id: "sovereign", term: "Sovereign", group: "Open vs closed", plain: "Owned and controlled by you/your country, not dependent on a foreign company.", why: "Sovereign choices survive the off-switch dice; dependent ones don't." },
  { id: "off-switch", term: "Off-switch", group: "Open vs closed", plain: "When a foreign company or government cuts off your access to AI you rely on.", why: "The whole danger of the game — borrowed/rented stacks can be switched off; owned ones can't." },

  // Compute & hosting terms
  { id: "cloud", term: "Cloud", group: "Compute & hosting", plain: "Renting computer power over the internet instead of owning the machines.", why: "Cheap and instant, but the landlord can evict you (the off-switch risk)." },
  { id: "sovereign-cloud", term: "Sovereign cloud", group: "Compute & hosting", plain: "A cloud run inside your own country under your own rules.", why: "Safer than a foreign cloud, though sometimes still built on foreign tech underneath." },
  { id: "hyperscaler", term: "Hyperscaler", group: "Compute & hosting", plain: "One of the giant US cloud companies (Amazon, Microsoft, Google).", why: "The easy, cheap option that quietly makes you dependent." },
  { id: "inference", term: "Inference", group: "Compute & hosting", plain: "Actually running a finished AI to answer users (as opposed to building it).", why: "Serving lots of users cheaply is how adoption scales." },
  { id: "on-device", term: "On-device / offline", group: "Compute & hosting", plain: "AI that runs right on a phone or laptop, no internet needed.", why: "Impossible to switch off and reaches anywhere, but less powerful." },

  // Real-world names
  { id: "nvidia", term: "Nvidia", group: "Real-world names", plain: "The US company that makes the best AI chips; nearly everyone depends on them.", why: "Top performance, high price, and a US dependency." },
  { id: "nscale", term: "Nscale", group: "Real-world names", plain: "A company that rents out Nvidia chips it has already installed.", why: "A faster, cheaper way to get good chips without buying them — but you don't own them." },
  { id: "asml", term: "ASML", group: "Real-world names", plain: "A Dutch company that makes the only machines capable of producing the most advanced chips.", why: "Whoever controls it can decide who else gets cutting-edge chips — pure leverage." },
  { id: "mistral", term: "Mistral", group: "Real-world names", plain: "France's leading AI company; makes a free, European AI and runs its own cloud.", why: "Lets France play a full home-grown, independent stack." },
  { id: "cohere", term: "Cohere", group: "Real-world names", plain: "A Canadian AI company focused on business customers.", why: "Canada's route to building strong models cheaply." },
  { id: "nemotron", term: "Nemotron", group: "Real-world names", plain: "A capable free AI released by Nvidia.", why: "A strong 'owned' AI — though it nudges you toward Nvidia's chips." },
  { id: "llama", term: "Llama", group: "Real-world names", plain: "A widely used free AI from Meta (Facebook).", why: "Popular and free, but its owner could stop sharing it someday." },
  { id: "deepseek", term: "DeepSeek", group: "Real-world names", plain: "A strong, cheap free AI from China.", why: "Great value, but carries political baggage." },
  { id: "eurohpc", term: "EuroHPC", group: "Real-world names", plain: "Europe's shared public supercomputers.", why: "Cheap, sovereign compute — just limited in size." },

  // Game terms
  { id: "adoption", term: "Adoption", group: "Game terms", plain: "How many people actually use your AI. Each option adds (or subtracts) this many adoption points.", why: "The main thing you're scored on — usage beats raw smarts here." },
  { id: "sovereignty", term: "Sovereignty", group: "Game terms", plain: "How independent and un-switch-off-able your stack is. Each option adds (or subtracts) this many sovereignty points — owned, home-built pieces raise it; rented foreign ones don't.", why: "The other half of your score, and what keeps you standing when the off-switch hits." },
  { id: "price-shift", term: "Price change", group: "Game terms", plain: "A discount or surcharge on this option this round. Green = cheaper (your region's strength or a helpful event); orange = pricier, frozen, or riskier because of the world event.", why: "Prices move every round — time your big buys for when they're cheap and not frozen." },
  { id: "recurring-cost", term: "Per-round cost", group: "Game terms", plain: "A fee you pay again every round for as long as you keep this — you're renting it, not owning it outright.", why: "Cheap to start, but it drains your budget over time and can be cut off." },
  { id: "list-price", term: "List vs. now price", group: "Game terms", plain: "The struck-through number is the normal price; the bold number is what it actually costs you this round after region and event changes.", why: "The gap is the discount or surcharge in action — buy when 'now' is below list." },
  { id: "coherence", term: "Coherence", group: "Game terms", plain: "Whether your five choices fit together sensibly.", why: "A matched set scores a bonus; a clashing one is penalized." },
  { id: "standing-deal", term: "Standing deal", group: "Game terms", plain: "A trade that repeats automatically every round.", why: "Worth more, but can break under pressure and hurt both sides." },
  { id: "sanction-risk", term: "Sanction risk", group: "Game terms", plain: "The chance a choice gets you politically punished — cut off from chips, deals, or markets.", why: "Cheap options like Chinese chips carry it; it spikes during certain events." },
  { id: "exposure", term: "Exposure", group: "Game terms", plain: "How vulnerable your stack is to being switched off.", why: "Every rented/foreign piece raises it; the off-switch dice hit high-exposure players hardest." },
  { id: "fragility-mark", term: "Fragility mark", group: "Game terms", plain: "A permanent dent your stack takes when the off-switch hits it.", why: "Damage isn't just for one round — shortcuts leave lasting scars on your score." },
  { id: "hallucinate", term: "Hallucinate", group: "Game terms", plain: "When an AI confidently states something false.", why: "A model built on too little compute is more likely to, and it can cost you users' trust." },
  { id: "aligned-jurisdiction", term: "Aligned jurisdiction", group: "Game terms", plain: "A country the US deems trustworthy enough for full AI access.", why: "The in-world rule that sorts who gets chips and models — and who gets the slow lane." },
  { id: "standing-investment", term: "Standing investment", group: "Game terms", plain: "When one player funds another in exchange for a cut of their final score.", why: "How money-rich, build-poor players (like the Gulf fund) win — by backing others." },

  // Deal types
  { id: "deal-swap", term: "Swap", group: "Making deals", plain: "A straight cash exchange — you pay them or they pay you, nothing else changes hands.", why: "The simplest deal: settle a favor, split a cost, or just move money where it's needed." },
  { id: "deal-asset", term: "Asset deal", group: "Making deals", plain: "Hand over a specific thing you hold — a license, chip allocation, channel, or financing.", why: "The fastest way to fill someone's exact gap; sell it outright or lease it (below)." },
  { id: "deal-access", term: "Access deal", group: "Making deals", plain: "Grant another player an unlock their stack is missing — like cluster compute or a market channel — without giving up the asset itself.", why: "Lets you rent out what you've built so a partner can advance, while you keep owning it." },
  { id: "lease", term: "Lease", group: "Making deals", plain: "Rent the asset out instead of selling it: they get to use it, you keep ownership, and it recurs every round.", why: "Steady income and you never lose the asset — but a lease can be cut off, unlike an outright sale." },
];

export const GLOSSARY_BY_ID: Record<string, GlossaryEntry> = Object.fromEntries(
  GLOSSARY.map((g) => [g.id, g]),
);
