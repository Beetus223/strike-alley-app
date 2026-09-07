export const CENTRE = {
  name: "Vegreville Bowling Lanes",
  tagline: "Five pins, five decades, one hometown alley.",
  address: "5026 50 Street, Vegreville, AB T9C 1R8",
  phone: "(780) 632-2695",
  email: "hello@vegrevillebowling.ca",
  lanes: 8,
  mapQuery: "5026+50+Street+Vegreville+AB",
};

export const HOURS = [
  { day: "Monday", open: "Closed (private bookings)" },
  { day: "Tuesday", open: "4:00 PM – 10:00 PM" },
  { day: "Wednesday", open: "4:00 PM – 10:00 PM" },
  { day: "Thursday", open: "4:00 PM – 11:00 PM" },
  { day: "Friday", open: "3:00 PM – 12:00 AM" },
  { day: "Saturday", open: "12:00 PM – 12:00 AM" },
  { day: "Sunday", open: "12:00 PM – 8:00 PM" },
];

export const PRICING = [
  { label: "Adult game (13+)", price: "$5.25", note: "per person, per game" },
  { label: "Youth / senior game", price: "$4.25", note: "12 and under, 65+" },
  { label: "Shoe rental", price: "$3.00", note: "all sizes, kids to size 15" },
  { label: "Lane by the hour", price: "$32.00", note: "up to 6 bowlers, shoes extra" },
  { label: "Glow bowling (Fri/Sat after 8 PM)", price: "$6.50", note: "per person, per game" },
  { label: "Family four-pack", price: "$62.00", note: "2 hours, 4 pairs of shoes, 1 pitcher of pop" },
];

export const LEAGUES = [
  {
    slug: "monday-mixed",
    name: "Monday Mixed",
    night: "Monday",
    time: "7:00 PM",
    season: "September – April",
    format: "Teams of 4, 3 games, handicap 80% of 200",
    fee: "$18 per bowler, per night",
    spots: "2 team spots open",
    description:
      "Our biggest league. Mixed teams of four bowl three games with handicap, so brand-new bowlers can beat the veterans on any given night.",
  },
  {
    slug: "tuesday-seniors",
    name: "Tuesday Golden Pins",
    night: "Tuesday",
    time: "1:00 PM",
    season: "October – March",
    format: "Teams of 3, 3 games, handicap 90% of 180",
    fee: "$12 per bowler, per afternoon",
    spots: "Open to all — spares always welcome",
    description:
      "Afternoon league for bowlers 55 and up. Coffee is on the house and the pace is friendly.",
  },
  {
    slug: "thursday-mens",
    name: "Thursday Men's Classic",
    night: "Thursday",
    time: "7:30 PM",
    season: "September – April",
    format: "Teams of 5, 3 games, scratch and handicap divisions",
    fee: "$20 per bowler, per night",
    spots: "Wait list",
    description:
      "The most competitive night on the calendar. Scratch division averages sit north of 220.",
  },
  {
    slug: "youth-bowling-canada",
    name: "Saturday YBC Youth",
    night: "Saturday",
    time: "9:30 AM",
    season: "September – April",
    format: "Bantam, Junior and Senior divisions, 2 games with coaching",
    fee: "$11 per bowler, per week",
    spots: "Registering now",
    description:
      "Youth Bowling Canada certified coaching for ages 5–18. Every bowler finishes the season with an official YBC average.",
  },
];

export const EVENTS = [
  {
    title: "Glow Bowl Fridays",
    when: "Every Friday, 8:00 PM – midnight",
    blurb: "Lights down, black lights up, DJ playlist and $6.50 games all night.",
    tag: "Weekly",
  },
  {
    title: "Toonie Sunday",
    when: "Sundays, 12:00 – 4:00 PM",
    blurb: "$2 shoe rental and half-price games for families with kids 12 and under.",
    tag: "Weekly",
  },
  {
    title: "Vegreville Pysanka Open",
    when: "July 11 – 12",
    blurb: "Our annual 5-pin singles tournament during Pysanka Festival weekend. 64-bowler field, $1,500 top prize.",
    tag: "Tournament",
  },
  {
    title: "Turkey Roll",
    when: "December 13, 6:00 PM",
    blurb: "Roll a triple strike and take home a frozen turkey. Doubles format, all ages.",
    tag: "Seasonal",
  },
];

export const MENU = [
  {
    section: "Off the Grill",
    items: [
      { name: "Lane Burger", price: "$9.50", desc: "Quarter-pound patty, cheddar, house sauce" },
      { name: "Chicken Strips & Fries", price: "$11.00", desc: "Four strips, plum or honey dill" },
      { name: "Hot Dog", price: "$4.75", desc: "All-beef, add chili + $1.50" },
      { name: "Grilled Cheese", price: "$6.00", desc: "Served with pickle spear" },
    ],
  },
  {
    section: "Shareables",
    items: [
      { name: "Nacho Basket", price: "$12.50", desc: "Cheese, jalapeños, salsa and sour cream" },
      { name: "Perogy Bowl", price: "$10.50", desc: "Local perogies, bacon, onion, sour cream" },
      { name: "Onion Rings", price: "$7.00", desc: "Beer battered" },
      { name: "Pizza (12\")", price: "$16.00", desc: "Pepperoni, Hawaiian or cheese" },
    ],
  },
  {
    section: "Drinks & Sweets",
    items: [
      { name: "Fountain Pop", price: "$2.75", desc: "Free refills" },
      { name: "Milkshake", price: "$5.50", desc: "Chocolate, vanilla or strawberry" },
      { name: "Pitcher of Pop", price: "$7.50", desc: "Serves four" },
      { name: "Soft Serve Cone", price: "$3.25", desc: "Dipped + $0.75" },
    ],
  },
];

export const PARTY_PACKAGES = [
  {
    name: "Strike Party",
    price: "$18 / guest",
    min: "Minimum 6 guests",
    includes: [
      "90 minutes of bowling on your own lane",
      "Shoe rental for every guest",
      "Hot dog, fries and a drink each",
      "Reserved party table and host",
    ],
  },
  {
    name: "Glow Party",
    price: "$24 / guest",
    min: "Minimum 8 guests",
    includes: [
      "2 hours of glow bowling",
      "Shoe rental and glow wristbands",
      "Pizza, pop pitchers and soft serve",
      "Music requests and lane-side decorations",
    ],
  },
  {
    name: "Whole House Rental",
    price: "$450 flat",
    min: "Up to 48 people",
    includes: [
      "All 8 lanes for 3 hours",
      "Shoes for everyone",
      "Private snack bar service",
      "Sound system and scoreboard messages",
    ],
  },
];

export const NAV = [
  { to: "/", label: "Home" },
  { to: "/bowling", label: "Bowling & Prices" },
  { to: "/leagues", label: "Leagues" },
  { to: "/events", label: "Events" },
  { to: "/glow", label: "Glow Bowling" },
  { to: "/parties", label: "Parties" },
  { to: "/menu", label: "Snack Bar" },
  { to: "/rentals", label: "Rentals" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;
