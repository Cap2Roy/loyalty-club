// Seed script for the demo data. Run with: node prisma/seed.mjs
// Idempotent: upserts by unique keys (user email, business slug) so re-running is safe.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "password123";

async function upsertUser(email, password = PASSWORD) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
  });
  return user;
}

async function upsertStaff(userId, businessId, role) {
  return prisma.businessStaff.upsert({
    where: { userId_businessId: { userId, businessId } },
    update: {},
    create: { userId, businessId, role },
  });
}

async function seedProgram(businessId, data) {
  return prisma.program.upsert({
    where: { businessId },
    update: data,
    create: { businessId, ...data },
  });
}

async function upsertReward(businessId, title, data) {
  const existing = await prisma.reward.findFirst({ where: { businessId, title } });
  if (existing) {
    return prisma.reward.update({ where: { id: existing.id }, data });
  }
  return prisma.reward.create({ data: { businessId, title, ...data } });
}

async function upsertOffer(businessId, title, data) {
  const existing = await prisma.offer.findFirst({ where: { businessId, title } });
  if (existing) {
    return prisma.offer.update({ where: { id: existing.id }, data });
  }
  return prisma.offer.create({ data: { businessId, title, ...data } });
}

async function upsertMembership(userId, businessId, data) {
  return prisma.membership.upsert({
    where: { userId_businessId: { userId, businessId } },
    update: data,
    create: { userId, businessId, ...data },
  });
}

async function seedMembershipActivity(membership, businessId, staffId, { points, spend }) {
  const hasCheckin = await prisma.checkin.findFirst({
    where: { membershipId: membership.id },
  });
  if (!hasCheckin) {
    await prisma.checkin.create({
      data: { membershipId: membership.id, businessId, staffId, points, spend },
    });
  }
  const hasLedger = await prisma.ledgerEntry.findFirst({
    where: { membershipId: membership.id },
  });
  if (!hasLedger) {
    await prisma.ledgerEntry.create({
      data: { membershipId: membership.id, delta: points, reason: "EARN", note: "Seed check-in" },
    });
  }
}

async function seedBusiness({ name, slug, program, ownerEmail, staffEmail, memberEmails, address = "", latitude = null, longitude = null }) {
  const business = await prisma.business.upsert({
    where: { slug },
    update: { name: program.name, address, latitude, longitude },
    create: { name: program.name, slug, address, latitude, longitude },
  });

  const owner = await upsertUser(ownerEmail);
  await upsertStaff(owner.id, business.id, "OWNER");
  await seedProgram(business.id, program.data);

  let staffId = null;
  if (staffEmail) {
    const staff = await upsertUser(staffEmail);
    const staffLink = await upsertStaff(staff.id, business.id, "STAFF");
    staffId = staffLink.userId;
  }

  const members = [];
  for (const [index, email] of memberEmails.entries()) {
    const member = await upsertUser(email);
    const membership = await upsertMembership(member.id, business.id, {
      points: program.memberPoints[index],
      lifetimeEarned: program.memberPoints[index],
      lifetimeSpend: program.memberSpend[index],
    });
    await seedMembershipActivity(membership, business.id, staffId, {
      points: program.memberPoints[index],
      spend: program.memberSpend[index],
    });
    members.push(membership);
  }

  for (const reward of program.rewards ?? (program.reward ? [program.reward] : [])) {
    await upsertReward(business.id, reward.title, {
      description: reward.description,
      cost: reward.cost,
      expiresInDays: reward.expiresInDays ?? null,
    });
  }
  for (const offer of program.offers ?? (program.offer ? [program.offer] : [])) {
    await upsertOffer(business.id, offer.title, {
      description: offer.description,
      kind: offer.kind,
      discount: offer.discount,
      startsAt: offer.startsAt ?? null,
      endsAt: offer.endsAt ?? null,
      active: true,
    });
  }

  return { business, owner, members };
}

// ─── Business 1: Blue Cup Coffee ──────────────────────────────────────────
const coffeeMembers = {
  emails: ["member1@bluecup.test", "member2@bluecup.test", "member3@bluecup.test"],
  points: [420, 180, 65],
  spend: [42, 18, 6.5],
};

const blueCup = await seedBusiness({
  slug: "blue-cup-coffee",
  name: "Blue Cup Coffee",
  program: {
    name: "Blue Cup Coffee",
    data: {
      pointsName: "beans",
      earnRate: 10,
      minRedeem: 100,
      currency: "USD",
      tierNames: "Bean,Sprout,Roast",
      tierThresholds: "200,500",
    },
    memberPoints: coffeeMembers.points,
    memberSpend: coffeeMembers.spend,
    rewards: [
      { title: "Free latte", description: "Any latte on the house — oat milk included.", cost: 100, expiresInDays: 60 },
      { title: "Free pastry", description: "Any pastry from the case.", cost: 150, expiresInDays: 30 },
      { title: "1lb beans to go", description: "Take home a pound of our signature roast.", cost: 400, expiresInDays: 90 },
    ],
    offers: [
      { title: "Happy hour 20% off", description: "20% off all drinks between 2pm and 4pm weekdays.", kind: "SALE", discount: "20% off" },
      { title: "Bring a friend, both earn 2x beans", description: "Show your friend's referral QR at the counter and you both earn 2x beans on that order.", kind: "PROMO", discount: "2x beans" },
      { title: "Free size upgrade", description: "Trade up any drink to a large, on us.", kind: "PROMO", discount: "Free upgrade" },
    ],
  },
  ownerEmail: "owner@bluecup.test",
  staffEmail: "staff@bluecup.test",
  memberEmails: coffeeMembers.emails,
  address: "42 Bleecker St, New York, NY 10012",
  latitude: 40.7308,
  longitude: -73.9973,
});

// ─── Business 2: Iron Gym ─────────────────────────────────────────────────
const gymMembers = {
  emails: ["member1@irongym.test", "member2@irongym.test", "member3@irongym.test", "member4@irongym.test"],
  points: [2400, 850, 320, 60],
  spend: [1200, 425, 160, 30],
};

const ironGym = await seedBusiness({
  slug: "iron-gym",
  name: "Iron Gym",
  program: {
    name: "Iron Gym",
    data: {
      pointsName: "reps",
      earnRate: 2,
      minRedeem: 200,
      currency: "USD",
      tierNames: "Rookie,Pro,Elite,Legend",
      tierThresholds: "300,1000,3000",
    },
    memberPoints: gymMembers.points,
    memberSpend: gymMembers.spend,
    rewards: [
      { title: "Free guest pass", description: "Bring a friend for any single session.", cost: 300, expiresInDays: 60 },
      { title: "Free month", description: "One month of free membership.", cost: 500, expiresInDays: 90 },
      { title: "Personal training session", description: "One hour with a certified trainer.", cost: 1200, expiresInDays: null },
    ],
    offers: [
      { title: "New member: first month half price", description: "Join this month and get 50% off your first month.", kind: "SALE", discount: "50% off" },
      { title: "Refer a friend: 200 bonus reps", description: "Friend joins with your referral code, you get 200 bonus reps.", kind: "PROMO", discount: "200 reps" },
      { title: "Free fitness assessment", description: "Book a free 30-min assessment with our team.", kind: "PROMO", discount: "Free" },
    ],
  },
  ownerEmail: "owner@irongym.test",
  staffEmail: null,
  memberEmails: gymMembers.emails,
  address: "570 7th Ave, New York, NY 10018",
  latitude: 40.7468,
  longitude: -73.9857,
});

// ─── Business 3: Velvet Thread (clothing) ────────────────────────────────
const clothingMembers = {
  emails: ["member1@velvetthread.test", "member2@velvetthread.test", "member3@velvetthread.test", "member4@velvetthread.test"],
  points: [1450, 620, 280, 45],
  spend: [725, 310, 140, 22],
};

const velvetThread = await seedBusiness({
  slug: "velvet-thread",
  name: "Velvet Thread",
  program: {
    name: "Velvet Thread",
    data: {
      pointsName: "stitches",
      earnRate: 2,
      minRedeem: 200,
      currency: "USD",
      tierNames: "Cotton,Silk,Couture",
      tierThresholds: "250,750",
    },
    memberPoints: clothingMembers.points,
    memberSpend: clothingMembers.spend,
    rewards: [
      { title: "$10 off coupon", description: "$10 off any single purchase.", cost: 200, expiresInDays: 45 },
      { title: "Free accessory", description: "Any scarf, belt or hat in stock.", cost: 400, expiresInDays: 45 },
      { title: "Personal styling session", description: "One hour with a personal stylist — includes a curated rack.", cost: 900, expiresInDays: null },
    ],
    offers: [
      { title: "New season: 30% off outerwear", description: "All coats and jackets from the new fall collection.", kind: "SALE", discount: "30% off" },
      { title: "Members-only early access", description: "Shop the sale 24 hours before everyone else.", kind: "PROMO", discount: "Early access" },
      { title: "Birthday month: double stitches", description: "Tell us your birthday and earn 2x stitches all month.", kind: "PROMO", discount: "2x stitches" },
    ],
  },
  ownerEmail: "owner@velvetthread.test",
  staffEmail: "staff@velvetthread.test",
  memberEmails: clothingMembers.emails,
  address: "120 Newark Ave, Jersey City, NJ 07302",
  latitude: 40.7282,
  longitude: -74.0776,
});

// ─── Business 4: Slice Pizza (new) ────────────────────────────────────────
const pizzaMembers = {
  emails: ["member1@slicepizza.test", "member2@slicepizza.test", "member3@slicepizza.test"],
  points: [380, 160, 40],
  spend: [76, 32, 8],
};

const slicePizza = await seedBusiness({
  slug: "slice-pizza",
  name: "Slice Pizza",
  program: {
    name: "Slice Pizza",
    data: {
      pointsName: "slices",
      earnRate: 5,
      minRedeem: 50,
      currency: "USD",
      tierNames: "Crust,Cheese,Pepperoni",
      tierThresholds: "100,300",
    },
    memberPoints: pizzaMembers.points,
    memberSpend: pizzaMembers.spend,
    rewards: [
      { title: "Free slice", description: "Any single slice, any topping.", cost: 50, expiresInDays: 30 },
      { title: "Free garlic knots", description: "An order of 6 garlic knots.", cost: 100, expiresInDays: 30 },
      { title: "Free large pizza", description: "Any large pizza with up to 3 toppings.", cost: 300, expiresInDays: 60 },
    ],
    offers: [
      { title: "Two-for-Tuesday: BOGO slices", description: "Buy one slice, get one free every Tuesday.", kind: "SALE", discount: "BOGO" },
      { title: "Family deal: 20% off orders over $40", description: "Feed the whole family and save.", kind: "SALE", discount: "20% off" },
    ],
  },
  ownerEmail: "owner@slicepizza.test",
  staffEmail: "staff@slicepizza.test",
  memberEmails: pizzaMembers.emails,
  address: "725 7th Ave, New York, NY 10019",
  latitude: 40.7589,
  longitude: -73.9851,
});

// ─── Business 5: Bloom Salon & Spa (new) ─────────────────────────────────
const salonMembers = {
  emails: ["member1@bloomsalon.test", "member2@bloomsalon.test", "member3@bloomsalon.test"],
  points: [920, 380, 120],
  spend: [460, 190, 60],
};

const bloomSalon = await seedBusiness({
  slug: "bloom-salon",
  name: "Bloom Salon & Spa",
  program: {
    name: "Bloom Salon & Spa",
    data: {
      pointsName: "petals",
      earnRate: 2,
      minRedeem: 100,
      currency: "USD",
      tierNames: "Bud,Bloom,Bouquet",
      tierThresholds: "200,600",
    },
    memberPoints: salonMembers.points,
    memberSpend: salonMembers.spend,
    rewards: [
      { title: "Free add-on treatment", description: "Add a conditioning or scalp treatment to any visit.", cost: 100, expiresInDays: 45 },
      { title: "Free haircut", description: "A free cut with any color service.", cost: 250, expiresInDays: 60 },
      { title: "Spa day package", description: "Two-hour spa package: massage, facial, and mani.", cost: 800, expiresInDays: null },
    ],
    offers: [
      { title: "First visit 15% off", description: "New clients get 15% off any service.", kind: "SALE", discount: "15% off" },
      { title: "Refer a friend: 50 bonus petals each", description: "You both get 50 bonus petals when they book.", kind: "PROMO", discount: "50 petals" },
      { title: "Midweek special: half-price manicures", description: "Manicures are half price Tuesday through Thursday.", kind: "SALE", discount: "50% off" },
    ],
  },
  ownerEmail: "owner@bloomsalon.test",
  staffEmail: null,
  memberEmails: salonMembers.emails,
  address: "80 5th Ave, New York, NY 10011",
  latitude: 40.7430,
  longitude: -73.9840,
});

// ─── Business 6: Green Leaf Market (new) ─────────────────────────────────
const marketMembers = {
  emails: ["member1@greenleaf.test", "member2@greenleaf.test", "member3@greenleaf.test", "member4@greenleaf.test"],
  points: [580, 240, 100, 30],
  spend: [290, 120, 50, 15],
};

const greenLeaf = await seedBusiness({
  slug: "green-leaf-market",
  name: "Green Leaf Market",
  program: {
    name: "Green Leaf Market",
    data: {
      pointsName: "leaves",
      earnRate: 2,
      minRedeem: 100,
      currency: "USD",
      tierNames: "Seed,Sprout,Oak",
      tierThresholds: "150,500",
    },
    memberPoints: marketMembers.points,
    memberSpend: marketMembers.spend,
    rewards: [
      { title: "Free produce bundle", description: "A seasonal produce bundle worth up to $10.", cost: 100, expiresInDays: 30 },
      { title: "Free coffee for a month", description: "One free coffee every day for 30 days.", cost: 350, expiresInDays: 30 },
      { title: "10% off a full grocery trip", description: "10% off your entire basket in one visit.", cost: 500, expiresInDays: 60 },
    ],
    offers: [
      { title: "Weekend farmers market: 10% off local", description: "10% off all locally sourced items every weekend.", kind: "SALE", discount: "10% off" },
      { title: "Double leaves on organic", description: "Earn 2x leaves on all organic produce.", kind: "PROMO", discount: "2x leaves" },
    ],
  },
  ownerEmail: "owner@greenleaf.test",
  staffEmail: "staff@greenleaf.test",
  memberEmails: marketMembers.emails,
  address: "200 Wall St, New York, NY 10005",
  latitude: 40.7128,
  longitude: -74.0122,
});

// ─── Business 7: Tailored Gent (men's suits) ───────────────────────────────
const tailoredMembers = {
  emails: ["member1@tailoredgent.test", "member2@tailoredgent.test", "member3@tailoredgent.test", "member4@tailoredgent.test"],
  points: [2100, 780, 240, 50],
  spend: [1050, 390, 120, 25],
};

const tailoredGent = await seedBusiness({
  slug: "tailored-gent",
  name: "Tailored Gent",
  program: {
    name: "Tailored Gent",
    data: {
      pointsName: "threads",
      earnRate: 2,
      minRedeem: 200,
      currency: "USD",
      tierNames: "Off-Rack,Made-to-Measure,Bespoke",
      tierThresholds: "400,1200",
    },
    memberPoints: tailoredMembers.points,
    memberSpend: tailoredMembers.spend,
    rewards: [
      { title: "Free shirt with any suit", description: "Choose any dress shirt from our collection when you buy a suit.", cost: 200, expiresInDays: 60 },
      { title: "Free tailoring adjustment", description: "One free fit adjustment on any garment, anytime.", cost: 400, expiresInDays: 90 },
      { title: "Private fitting consultation", description: "One hour with our master tailor — includes fabric swatches and measurements.", cost: 1000, expiresInDays: null },
    ],
    offers: [
      { title: "Wedding season: 25% off suit packages", description: "Buy a suit, shirt, and tie together and save 25%.", kind: "SALE", discount: "25% off" },
      { title: "Refer a friend: 300 bonus threads each", description: "You both earn 300 bonus threads when your friend makes their first purchase.", kind: "PROMO", discount: "300 threads" },
      { title: "Free hemming for life", description: "Any pair of pants bought here gets free hemming for the life of the garment.", kind: "PROMO", discount: "Free hemming" },
    ],
  },
  ownerEmail: "owner@tailoredgent.test",
  staffEmail: "staff@tailoredgent.test",
  memberEmails: tailoredMembers.emails,
  address: "145 5th Ave, New York, NY 10010",
  latitude: 40.7422,
  longitude: -73.9900,
});

// ─── Business 8: Streetwear Co (men's streetwear) ─────────────────────────
const streetwearMembers = {
  emails: ["member1@streetwearco.test", "member2@streetwearco.test", "member3@streetwearco.test"],
  points: [640, 220, 60],
  spend: [320, 110, 30],
};

const streetwearCo = await seedBusiness({
  slug: "streetwear-co",
  name: "Streetwear Co",
  program: {
    name: "Streetwear Co",
    data: {
      pointsName: "drips",
      earnRate: 5,
      minRedeem: 100,
      currency: "USD",
      tierNames: "Fresh,Hype,Grail",
      tierThresholds: "200,600",
    },
    memberPoints: streetwearMembers.points,
    memberSpend: streetwearMembers.spend,
    rewards: [
      { title: "Free beanie", description: "Any beanie from our drop collection.", cost: 100, expiresInDays: 30 },
      { title: "Early access to new drops", description: "Shop new drops 48 hours before the public.", cost: 250, expiresInDays: 60 },
      { title: "Exclusive collab tee", description: "A limited-edition collaboration tee, members only.", cost: 500, expiresInDays: null },
    ],
    offers: [
      { title: "Drop day: 15% off everything", description: "On new drop days, members get 15% off the entire store.", kind: "SALE", discount: "15% off" },
      { title: "Trade-in: 200 bonus drips for old gear", description: "Bring in gently used gear and earn 200 bonus drips.", kind: "PROMO", discount: "200 drips" },
    ],
  },
  ownerEmail: "owner@streetwearco.test",
  staffEmail: "staff@streetwearco.test",
  memberEmails: streetwearMembers.emails,
  address: "186 Orchard St, New York, NY 10002",
  latitude: 40.7193,
  longitude: -73.9896,
});

// ─── Business 9: The Barbershop Club ──────────────────────────────────────
const barberMembers = {
  emails: ["member1@barberclub.test", "member2@barberclub.test", "member3@barberclub.test", "member4@barberclub.test"],
  points: [860, 340, 120, 25],
  spend: [430, 170, 60, 12],
};

const barberClub = await seedBusiness({
  slug: "barbershop-club",
  name: "The Barbershop Club",
  program: {
    name: "The Barbershop Club",
    data: {
      pointsName: "snips",
      earnRate: 5,
      minRedeem: 50,
      currency: "USD",
      tierNames: "Stubble,Starch,Clean Cut",
      tierThresholds: "100,300",
    },
    memberPoints: barberMembers.points,
    memberSpend: barberMembers.spend,
    rewards: [
      { title: "Free hot towel shave", description: "A classic hot towel shave with any haircut.", cost: 50, expiresInDays: 30 },
      { title: "Free beard trim", description: "Any beard shape-up or trim, on the house.", cost: 100, expiresInDays: 30 },
      { title: "Monthly grooming pass", description: "Four haircuts in one month — bring a friend for one of them.", cost: 300, expiresInDays: 60 },
    ],
    offers: [
      { title: "First cut half price", description: "New members get 50% off their first haircut.", kind: "SALE", discount: "50% off" },
      { title: "Refer a friend: 50 bonus snips each", description: "You and your friend both earn 50 bonus snips on their first visit.", kind: "PROMO", discount: "50 snips" },
      { title: "Father-son duo: 20% off both", description: "Bring your son and you both get 20% off.", kind: "SALE", discount: "20% off" },
    ],
  },
  ownerEmail: "owner@barberclub.test",
  staffEmail: "staff@barberclub.test",
  memberEmails: barberMembers.emails,
  address: "115 Rivington St, New York, NY 10002",
  latitude: 40.7188,
  longitude: -73.9846,
});

// ─── Cross-club memberships ───────────────────────────────────────────────
// Some members are in multiple clubs — shows the multi-business value prop.
async function crossJoin(userEmail, slug, { points, spend }) {
  const user = await upsertUser(userEmail);
  const biz = await prisma.business.findUnique({ where: { slug } });
  if (!biz) return;
  const membership = await upsertMembership(user.id, biz.id, {
    points,
    lifetimeEarned: points,
    lifetimeSpend: spend,
  });
  await seedMembershipActivity(membership, biz.id, null, { points, spend });
}

await crossJoin("member1@bluecup.test", "slice-pizza", { points: 120, spend: 24 });
await crossJoin("member2@irongym.test", "blue-cup-coffee", { points: 90, spend: 9 });
await crossJoin("member1@velvetthread.test", "bloom-salon", { points: 200, spend: 100 });
await crossJoin("member1@tailoredgent.test", "streetwear-co", { points: 180, spend: 36 });
await crossJoin("member1@barberclub.test", "tailored-gent", { points: 90, spend: 45 });
await crossJoin("member2@streetwearco.test", "barbershop-club", { points: 60, spend: 12 });

// ─── Pending staff invites ────────────────────────────────────────────────
// Blue Cup owner invited this account; sign up to accept.
await upsertUser("invited.staff@bluecup.test");
await prisma.staffInvite.upsert({
  where: { businessId_email: { businessId: blueCup.business.id, email: "invited.staff@bluecup.test" } },
  update: {},
  create: {
    businessId: blueCup.business.id,
    email: "invited.staff@bluecup.test",
    invitedBy: blueCup.owner.id,
  },
});

// Slice Pizza owner invited a second staff member.
await upsertUser("invited.staff@slicepizza.test");
await prisma.staffInvite.upsert({
  where: { businessId_email: { businessId: slicePizza.business.id, email: "invited.staff@slicepizza.test" } },
  update: {},
  create: {
    businessId: slicePizza.business.id,
    email: "invited.staff@slicepizza.test",
    invitedBy: slicePizza.owner.id,
  },
});

// ─── Summary ──────────────────────────────────────────────────────────────
const allMemberships = await prisma.membership.count();
const allBusinesses = await prisma.business.count();
const allOffers = await prisma.offer.count({ where: { active: true } });
const allRewards = await prisma.reward.count({ where: { active: true } });

console.log("── Seed complete ──");
console.log(`  ${allBusinesses} businesses`);
console.log(`  ${allMemberships} memberships`);
console.log(`  ${allRewards} active rewards`);
console.log(`  ${allOffers} active offers`);
console.log("Demo accounts (password123):");
for (const email of [
  "owner@bluecup.test",
  "staff@bluecup.test",
  ...coffeeMembers.emails,
  "owner@irongym.test",
  ...gymMembers.emails,
  "owner@velvetthread.test",
  "staff@velvetthread.test",
  ...clothingMembers.emails,
  "owner@slicepizza.test",
  "staff@slicepizza.test",
  ...pizzaMembers.emails,
  "owner@bloomsalon.test",
  ...salonMembers.emails,
  "owner@greenleaf.test",
  "staff@greenleaf.test",
  ...marketMembers.emails,
  "owner@tailoredgent.test",
  "staff@tailoredgent.test",
  ...tailoredMembers.emails,
  "owner@streetwearco.test",
  "staff@streetwearco.test",
  ...streetwearMembers.emails,
  "owner@barberclub.test",
  "staff@barberclub.test",
  ...barberMembers.emails,
  "invited.staff@bluecup.test (pending invite)",
  "invited.staff@slicepizza.test (pending invite)",
]) {
  console.log(`  ${email}`);
}

await prisma.$disconnect();
