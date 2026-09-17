/**
 * Static knowledge base for the help page and chat assistant.
 * The matching engine uses tokenized keyword scoring — no external AI needed.
 */

export type KBEntry = {
  id: string;
  category: string;
  question: string;
  /** Keywords used for matching; supplemented by tokenized question. */
  keywords: string[];
  answer: string;
};

export type KBMatch = {
  entry: KBEntry;
  score: number;
};

export const KB_CATEGORIES = [
  "Getting started",
  "Points & rewards",
  "Business tools",
  "Account & security",
  "Referrals",
  "Phone verification",
] as const;

export const KNOWLEDGE_BASE: KBEntry[] = [
  // ---- Getting started ----
  {
    id: "what-is",
    category: "Getting started",
    question: "What is LoyaltyClub?",
    keywords: ["what", "loyaltyclub", "about", "platform", "app"],
    answer:
      "LoyaltyClub is a multi-business loyalty platform. One account works across every participating business — coffee shops, gyms, salons, clothing stores and more. You join a club, earn points on purchases, climb tiers, and redeem rewards.",
  },
  {
    id: "how-join",
    category: "Getting started",
    question: "How do I join a club?",
    keywords: ["join", "club", "sign", "up", "register", "become", "member"],
    answer:
      "Create an account at /register, then visit the Join a Club page (/app/join) to browse all participating businesses. Tap any club to join instantly — no approval needed. You can also join by scanning a friend's referral QR code or visiting a club's page directly.",
  },
  {
    id: "how-many-clubs",
    category: "Getting started",
    question: "Can I join multiple clubs?",
    keywords: ["multiple", "clubs", "join", "several", "many", "different"],
    answer:
      "Yes! One account, every club. You can join as many participating businesses as you like. Each membership is independent — your points, tier, and rewards are tracked per club.",
  },
  {
    id: "find-clubs",
    category: "Getting started",
    question: "How do I find participating businesses?",
    keywords: ["find", "discover", "browse", "search", "businesses", "stores", "shops", "map"],
    answer:
      "Visit the Explore Clubs page (/app/explore) to browse all clubs, or check the Map page (/app/map) to see businesses near you on an interactive map with geolocation.",
  },

  // ---- Points & rewards ----
  {
    id: "earn-points",
    category: "Points & rewards",
    question: "How do I earn points?",
    keywords: ["earn", "points", "get", "accumulate", "collect", "purchase", "spend"],
    answer:
      "Points are earned automatically when a staff member records your purchase at the counter. The earn rate is set by each business (typically 10 points per $1 spent). You can see your points balance on your club page or digital card.",
  },
  {
    id: "redeem-rewards",
    category: "Points & rewards",
    question: "How do I redeem rewards?",
    keywords: ["redeem", "reward", "coupon", "claim", "exchange", "points", "spend"],
    answer:
      "Visit your club page (/app/club/[slug]) and scroll to the Rewards section. Each reward has a point cost — tap Redeem when you have enough points. You'll receive a coupon code that staff can scan at the counter. You can also see all your coupons on the same page.",
  },
  {
    id: "tiers",
    category: "Points & rewards",
    question: "What are tiers and how do they work?",
    keywords: ["tier", "level", "rank", "progress", "upgrade", "lifetime", "spend"],
    answer:
      "Tiers are based on your lifetime spend at a club (total dollars spent since joining). Each business defines its own tier names and thresholds — for example, Bronze, Silver, Gold. Higher tiers may unlock better rewards or perks. Your tier never decreases.",
  },
  {
    id: "points-expire",
    category: "Points & rewards",
    question: "Do my points expire?",
    keywords: ["expire", "expiration", "expiry", "valid", "points", "reset"],
    answer:
      "Points do not expire by default. However, coupons redeemed from rewards may have an expiration date set by the business. Check the Expires column in your Coupons table on the club page.",
  },
  {
    id: "digital-card",
    category: "Points & rewards",
    question: "What is the digital loyalty card?",
    keywords: ["digital", "card", "passbook", "wallet", "qr", "phone", "show"],
    answer:
      "Each club membership has a digital loyalty card at /app/card/[slug]. It displays your points balance, tier, a QR code for referrals, and lifetime stats in a passbook-style layout. Show it to staff or share the QR with friends.",
  },

  // ---- Business tools ----
  {
    id: "biz-create",
    category: "Business tools",
    question: "How do I create a business?",
    keywords: ["create", "business", "new", "setup", "start", "own", "owner"],
    answer:
      "After signing in, go to the Business section (/biz) and click Create new business. Enter your business name, slug (URL), and configure your loyalty program — points name, earn rate, minimum redemption, currency, and tier thresholds.",
  },
  {
    id: "biz-checkin",
    category: "Business tools",
    question: "How do I record a purchase (check-in)?",
    keywords: ["checkin", "check", "in", "record", "purchase", "counter", "staff", "sale"],
    answer:
      "Staff can record purchases at the Counter page (/counter/[businessId]). Enter the member's referral code or search by email, input the spend amount, and submit. Points are awarded instantly. Owners can also use the Load Sales tab to batch-import multiple purchases at once.",
  },
  {
    id: "biz-batch",
    category: "Business tools",
    question: "What is bulk sales import (Load Sales)?",
    keywords: ["batch", "bulk", "import", "load", "sales", "multiple", "upload", "textarea"],
    answer:
      "The Load Sales tab on the Counter page lets staff paste multiple check-ins at once — one per line in `code,spend` format. Up to 100 entries can be submitted simultaneously, useful for end-of-day reconciliation. Each entry returns a per-line success or error result.",
  },
  {
    id: "biz-export",
    category: "Business tools",
    question: "Can I export data for accounting software?",
    keywords: ["export", "accounting", "quickbooks", "xero", "csv", "json", "download", "finance"],
    answer:
      "Yes. The business dashboard (/biz/[id]) has an Accounting Export section. Download data as CSV (compatible with QuickBooks, Xero, FreshBooks) or JSON. Both include checkins, ledger entries, and member balances with optional date filtering.",
  },
  {
    id: "biz-rewards-offers",
    category: "Business tools",
    question: "How do I create rewards and offers?",
    keywords: ["create", "reward", "offer", "sale", "promo", "discount", "add", "new"],
    answer:
      "Owners can manage rewards and offers from the business dashboard tabs. Rewards are point-redeemable coupons (e.g., 'Free Coffee — 100 points'). Offers are promotional announcements (sales, events) shown on the Offers feed for members. Toggle active/inactive anytime.",
  },
  {
    id: "biz-staff",
    category: "Business tools",
    question: "How do I add staff members?",
    keywords: ["staff", "add", "invite", "team", "employee", "counter", "role"],
    answer:
      "Owners can invite staff from the business Settings tab. Enter the staff member's email — if they have an account, they can accept the invite and gain counter access. Staff can record check-ins but cannot change business settings.",
  },

  // ---- Account & security ----
  {
    id: "change-password",
    category: "Account & security",
    question: "How do I change my password?",
    keywords: ["change", "password", "reset", "update", "new", "security"],
    answer:
      "Go to Account (/app/account) and use the Change Password form. Enter your current password and a new password (minimum 8 characters). Your session stays active after the change.",
  },
  {
    id: "update-profile",
    category: "Account & security",
    question: "How do I update my name and phone number?",
    keywords: ["update", "name", "profile", "phone", "edit", "change"],
    answer:
      "Visit Account (/app/account) and use the Profile form. You can update your display name and phone number. If you change your phone number, you'll need to re-verify it via SMS.",
  },
  {
    id: "account-security",
    category: "Account & security",
    question: "Is my account secure?",
    keywords: ["secure", "security", "safe", "password", "encrypt", "protect", "data"],
    answer:
      "Passwords are hashed with bcrypt (10 rounds). Sessions use HMAC-signed httpOnly cookies. API routes enforce role-based access control — staff can only manage businesses they belong to, owners have full control.",
  },

  // ---- Referrals ----
  {
    id: "referral-code",
    category: "Referrals",
    question: "What is a referral code?",
    keywords: ["referral", "code", "invite", "friend", "share", "link", "qr"],
    answer:
      "Every membership has a unique referral code. Share it with friends — when they scan your QR or use your link to join the same club, they become a member instantly. You can find your code and QR on your club page or digital card.",
  },
  {
    id: "cross-store-referral",
    category: "Referrals",
    question: "What are cross-store referrals?",
    keywords: ["cross", "store", "referral", "another", "club", "different", "bonus", "points"],
    answer:
      "Cross-store referrals let you refer friends to a different club than the one you're a member of. Create a referral from your club page — pick a source club (yours) and a target club (another business). When a friend claims it, you both earn bonus points (default 50 each) at your respective clubs.",
  },
  {
    id: "create-referral",
    category: "Referrals",
    question: "How do I create a cross-store referral?",
    keywords: ["create", "cross", "store", "referral", "new", "share", "generate"],
    answer:
      "On any club page (/app/club/[slug]), scroll to the 'Refer to another club' section. Select a source club (one you're a member of) and a target club (any other business). Click Create — you'll get a shareable code and link. The referral expires after 30 days.",
  },
  {
    id: "claim-referral",
    category: "Referrals",
    question: "How do I claim a referral code?",
    keywords: ["claim", "use", "redeem", "referral", "code", "join", "friend"],
    answer:
      "To claim a referral, use the claim API endpoint with the referral code. The system creates your membership at the target business (if you don't have one), awards you the referee bonus points, and awards the referrer their bonus at their source club.",
  },

  // ---- Phone verification ----
  {
    id: "phone-verify-why",
    category: "Phone verification",
    question: "Why should I verify my phone number?",
    keywords: ["why", "verify", "phone", "number", "sms", "whatsapp", "required"],
    answer:
      "Phone verification adds account security and enables future SMS/WhatsApp notifications. Some businesses may require a verified phone to join or redeem certain rewards. It's optional but recommended.",
  },
  {
    id: "phone-verify-how",
    category: "Phone verification",
    question: "How do I verify my phone number?",
    keywords: ["how", "verify", "phone", "sms", "code", "otp", "step"],
    answer:
      "Go to Account (/app/account) and use the Phone Verification section. Enter your phone number and click Send Code — a 6-digit code is sent via SMS/WhatsApp. Enter the code within 10 minutes to verify. You can also add a phone during registration.",
  },
  {
    id: "phone-verify-resend",
    category: "Phone verification",
    question: "I didn't receive my verification code. What do I do?",
    keywords: ["resend", "receive", "code", "sms", "not", "got", "missing", "again"],
    answer:
      "Codes expire after 10 minutes. Go back to Account, re-enter your phone number, and click Send Code again. If you're in a development/test environment, the code is returned in the API response — check the dev code hint shown in the UI.",
  },
];

// ---- Matching engine ----

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "shall", "can", "need", "i", "you",
  "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
  "my", "your", "his", "its", "our", "their", "this", "that", "these",
  "those", "what", "which", "who", "whom", "whose", "when", "where",
  "why", "how", "all", "both", "each", "few", "more", "most", "other",
  "some", "such", "no", "nor", "not", "only", "own", "same", "so",
  "than", "too", "very", "just", "but", "or", "and", "if", "then",
  "else", "for", "of", "at", "by", "with", "from", "to", "in", "on",
  "about", "into", "through", "during", "before", "after", "above",
  "below", "up", "down", "out", "off", "over", "under", "again",
  "further", "once", "here", "there", "as", "also",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

/** Scores a query against all KB entries. Returns matches sorted by score descending. */
export function matchKB(query: string, limit = 3): KBMatch[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const matches: KBMatch[] = [];

  for (const entry of KNOWLEDGE_BASE) {
    const entryTokens = new Set([
      ...entry.keywords.flatMap(tokenize),
      ...tokenize(entry.question),
    ]);

    let score = 0;
    for (const token of tokens) {
      if (entryTokens.has(token)) {
        score += 2;
      } else if (entryTokens.has(token.slice(0, -1)) || entryTokens.has(token + "s")) {
        score += 1;
      }
    }

    // Bonus for multi-word phrase matches in the question
    const queryLower = query.toLowerCase();
    if (entry.question.toLowerCase().includes(queryLower) && queryLower.length > 3) {
      score += 5;
    }

    if (score > 0) {
      matches.push({ entry, score });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit);
}

/** Returns the best match for a query, or null if score is too low. */
export function bestMatch(query: string): KBMatch | null {
  const matches = matchKB(query, 1);
  if (matches.length === 0 || matches[0].score < 2) return null;
  return matches[0];
}
