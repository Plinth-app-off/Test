const today_d = new Date();
const daysAgo = (n) => {
  const d = new Date(today_d);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export const SEED_CLIENTS = [
  { id: 'c1', name: 'Mehta Residence — Koregaon Park', short: 'Mehta Residence', budget: 4800000, notes: '3BHK duplex renovation. Marble flooring in foyer + ground floor.', active: true, color: '#1f3c6e', started: daysAgo(84) },
  { id: 'c2', name: 'Kapoor Bungalow — Aundh', short: 'Kapoor Bungalow', budget: 7500000, notes: 'New-build 4BHK. Structural 80% complete.', active: true, color: '#c9341e', started: daysAgo(120) },
  { id: 'c3', name: 'Rao Studio Loft — Baner', short: 'Rao Studio Loft', budget: 1800000, notes: 'Small-footprint apartment interior. Design-led.', active: true, color: '#2f7a3a', started: daysAgo(46) },
  { id: 'c4', name: 'Iyer Clinic — Viman Nagar', short: 'Iyer Clinic', budget: 2600000, notes: 'Pediatric dental clinic. Medical-grade flooring.', active: true, color: '#7446a8', started: daysAgo(62) },
  { id: 'c5', name: 'Desai Villa — Lonavala', short: 'Desai Villa', budget: 3200000, notes: 'Weekend home. On hold — client travelling.', active: false, color: '#8c826f', started: daysAgo(200) },
];

export const SEED_VENDORS = [
  { id: 'v1', name: 'Raju Electricals', trade: 'Electrical', contact: '+91 98220 41123' },
  { id: 'v2', name: 'Shankar Plumbing Works', trade: 'Plumbing', contact: '+91 98765 04321' },
  { id: 'v3', name: 'Prakash Carpentry', trade: 'Carpentry', contact: '+91 99203 87654' },
  { id: 'v4', name: 'Deccan Marble & Stone', trade: 'Stone & Tile', contact: '+91 96500 12233' },
  { id: 'v5', name: 'Sunrise Paints & Finishes', trade: 'Painting', contact: '+91 90110 55901' },
  { id: 'v6', name: 'Gupta Hardware Co.', trade: 'Hardware', contact: '+91 98180 23344' },
  { id: 'v7', name: 'Lakshmi Steel Fabricators', trade: 'Metalwork', contact: '+91 99305 66712' },
  { id: 'v8', name: 'Ahmed Glass House', trade: 'Glazing', contact: '+91 97406 41298' },
];

export const SEED_EXPENSES = (() => {
  const out = [];
  let eid = 1;
  const add = (v, c, a, d, day) =>
    out.push({
      id: 'e' + eid,
      vendor_id: v,
      client_id: c,
      amount: a,
      description: d,
      date: daysAgo(day),
      receipt_url: null,
    });
    eid++;
  [
    ['v1','c1',84000,'Rough wiring — ground floor',70],['v1','c1',62400,'MCB panel + RCCB',52],['v1','c1',38200,'Lighting circuits — living',21],['v1','c2',146500,'Main panel + submains',95],['v1','c2',92000,'Conduit + wiring — 1st floor',60],['v1','c2',54800,'Outdoor landscape lighting',18],['v1','c3',28400,'Track lighting — studio',34],['v1','c4',71200,'Medical-grade wiring',48],['v1','c4',42600,'UPS backup circuits',12],
    ['v2','c1',52800,'Bathroom rough-in × 2',68],['v2','c1',34200,'CPVC line replacement',28],['v2','c2',128400,'Bathroom rough-in × 4',90],['v2','c2',76500,'Kitchen plumbing + RO',40],['v2','c2',45000,'Overhead tank manifold',15],['v2','c4',58600,'Clinic sinks + drainage',50],
    ['v3','c1',164000,'Kitchen modular — base + tall',42],['v3','c1',98000,'Wardrobes × 2',24],['v3','c1',46500,'Foyer console + panelling',9],['v3','c2',212000,'Full kitchen + island',55],['v3','c2',138000,'Wardrobes × 3',30],['v3','c3',92400,'Bespoke desk + shelving',26],['v3','c3',54800,'Bed platform + headboard',11],['v3','c4',76000,'Reception counter',32],['v3','c4',34500,'Patient cabinetry',7],
    ['v4','c1',246000,'Italian marble — foyer + GF',58],['v4','c1',84000,'Kitchen countertop',14],['v4','c2',412000,'Full-house flooring',72],['v4','c2',118000,'Staircase cladding',22],['v4','c4',92000,'Medical-grade vinyl subfloor',44],
    ['v5','c1',68400,'Interior primer + 2 coats',18],['v5','c2',124000,'Exterior weather coat',28],['v5','c2',56000,'Interior emulsion — bedrooms',8],['v5','c3',42000,'Lime wash finish',4],['v5','c4',38600,'Antimicrobial coating',20],
    ['v6','c1',52400,'Door hardware set',36],['v6','c2',94800,'Hardware + locks — all rooms',48],['v6','c2',28000,'Curtain rods + fixtures',16],['v6','c3',18600,'Studio hardware set',22],['v6','c4',31400,'Cabinet hardware',14],
    ['v7','c1',128000,'Spiral staircase fabrication',50],['v7','c2',186000,'MS railings + balconies',64],['v7','c4',42000,'Glass partition frame',28],
    ['v8','c1',56000,'Shower enclosures × 2',16],['v8','c2',168000,'Balcony glazing',38],['v8','c3',38400,'Toughened-glass partition',7],['v8','c4',72000,'Reception glazing + clinic doors',24],
  ].forEach((a) => add(...a));
  return out;
})();

export const SEED_GEN = (() => {
  const out = [];
  let gid = 1;
  const add = (c, cat, a, d, day) =>
    out.push({
      id: 'g' + gid,
      client_id: c,
      category: cat,
      amount: a,
      description: d,
      date: daysAgo(day),
      receipt_url: null,
    });
    gid++;
  [
    ['c1','Transport',6800,'Site visits — driver + fuel',30],['c1','Permits & Fees',24000,'Society NOC',65],['c1','Food & Refreshments',3200,'Tea & snacks',14],['c1','Labour',18400,'Daily-wage helpers',7],
    ['c2','Permits & Fees',86000,'Municipal approvals',110],['c2','Transport',14200,'Material transport × 4',45],['c2','Tools & Equipment',38500,'Scaffolding rental',30],['c2','Food & Refreshments',6400,'Tea & lunch for crew',12],['c2','Miscellaneous',4800,'Stationery',5],
    ['c3','Transport',3200,'Material pickup',18],['c3','Miscellaneous',2400,'Cleaning supplies',6],
    ['c4','Permits & Fees',42000,'Health dept. registration',56],['c4','Transport',5400,'Site visits',22],['c4','Labour',12800,'Final cleaning crew',3],
  ].forEach((a) => add(...a));
  return out;
})();

export const SEED_PAY = [
  { id: 'p1', vendor_id: 'v4', client_id: 'c2', amount: 28000, note: 'Excess marble return — credit note', date: daysAgo(20) },
  { id: 'p2', vendor_id: 'v6', client_id: 'c1', amount: 4800, note: 'Defective locks returned', date: daysAgo(34) },
  { id: 'p3', vendor_id: 'v1', client_id: null, amount: 12000, note: 'Over-billed last invoice — refund', date: daysAgo(11) },
  { id: 'p4', vendor_id: 'v3', client_id: 'c2', amount: 18500, note: 'Surplus plywood returned', date: daysAgo(42) },
  { id: 'p5', vendor_id: 'v8', client_id: 'c4', amount: 6200, note: 'Glass size change — refund', date: daysAgo(16) },
];
