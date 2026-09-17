export const CENTRE = {
  name: "Vegreville Bowling Lanes",
  tagline: "Five pins, five decades, one hometown alley.",
  address: "5026 50 Street, Vegreville, AB T9C 1R8",
  phone: "(780) 632-2695",
  email: "hello@vegrevillebowling.ca",
  lanes: 8,
  mapQuery: "5026+50+Street+Vegreville+AB",
};

export const HOURS_NOTE =
  "Walk-ins are welcome but not guaranteed. Reservations are recommended and guarantee your lane.";

const LATE_NOTE = "We may stay open later for larger reservations or particularly busy nights.";

export const HOURS = [
  {
    day: "Monday",
    open: "5:30 PM – 9:00 PM",
    publicBowling: "5:30 PM – 6:30 PM",
    food: "5:30 PM – 8:30 PM",
    glow: null as string | null,
    note: null as string | null,
  },
  {
    day: "Tuesday",
    open: "10:30 AM – 10:00 PM",
    publicBowling: "10:30 AM – 1:00 PM and 3:00 PM – 4:15 PM",
    food: "10:30 AM – 9:30 PM",
    glow: null as string | null,
    note: null as string | null,
  },
  {
    day: "Wednesday",
    open: "10:30 AM – 10:00 PM",
    publicBowling: "10:30 AM – 1:00 PM",
    food: "10:30 AM – 9:30 PM",
    glow: null as string | null,
    note: null as string | null,
  },
  {
    day: "Thursday",
    open: "10:30 AM – 10:00 PM",
    publicBowling: "10:30 AM – 6:30 PM",
    food: "10:30 AM – 9:30 PM",
    glow: null as string | null,
    note: null as string | null,
  },
  {
    day: "Friday",
    open: "10:30 AM – 10:00 PM",
    publicBowling: "10:30 AM – 10:00 PM",
    food: "10:30 AM – 9:30 PM",
    glow: "7:00 PM – 10:00 PM" as string | null,
    note: LATE_NOTE as string | null,
  },
  {
    day: "Saturday",
    open: "10:30 AM – 10:00 PM",
    publicBowling: "10:30 AM – 10:00 PM",
    food: "10:30 AM – 9:30 PM",
    glow: "7:00 PM – 10:00 PM" as string | null,
    note: LATE_NOTE as string | null,
  },
  {
    day: "Sunday",
    open: "12:00 PM – 8:00 PM",
    publicBowling: "12:00 PM – 8:00 PM",
    food: "12:00 PM – 7:30 PM",
    glow: null as string | null,
    note: null as string | null,
  },
];

export const PRICING = [
  { label: "Adult game (13+)", price: "$5.25", note: "per person, per game" },
  { label: "Youth / senior game", price: "$4.25", note: "12 and under, 65+" },
  { label: "Shoe rental", price: "$3.00", note: "all sizes, kids to size 15" },
  { label: "Lane by the hour", price: "$32.00", note: "up to 6 bowlers, shoes extra" },
  { label: "Glow bowling (Fri/Sat after 7 PM)", price: "$6.50", note: "per person, per game" },
  {
    label: "Family four-pack",
    price: "$62.00",
    note: "2 hours, 4 pairs of shoes, 1 pitcher of pop",
  },
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
    when: "Every Friday, 7:00 PM – 10:00 PM",
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
    blurb:
      "Our annual 5-pin singles tournament during Pysanka Festival weekend. 64-bowler field, $1,500 top prize.",
    tag: "Tournament",
  },
  {
    title: "Turkey Roll",
    when: "December 13, 6:00 PM",
    blurb: "Roll a triple strike and take home a frozen turkey. Doubles format, all ages.",
    tag: "Seasonal",
  },
];

export const SNACK_BAR_PHONE = "780-632-7665";

export interface MenuGroup {
  section: string;
  note?: string;
  items: { name: string; price: string; desc?: string }[];
}

export const MENU: MenuGroup[] = [
  {
    section: "Appetizers",
    items: [
      {
        name: "Cheddar Cheese Ball",
        price: "$12.00",
        desc: "Melt-in-your-mouth cheddar goodness. Add gravy to make it even more wonderful!",
      },
      {
        name: "Mini Carnival-Style Donuts",
        price: "$7.50",
        desc: "10 donuts per order, coated with delicious sugar and cinnamon sweetness.",
      },
      {
        name: "Fries",
        price: "$4.50",
        desc: "Small — $4.50 · Large — $6.50 · Add gravy — $2.00",
      },
      {
        name: "Jalapeño Poppers",
        price: "$9.00",
        desc: "Cream cheese-filled jalapeño poppers with a crunchy coating. Yum!",
      },
      {
        name: "Mozza Cheese Sticks with Ranch Dip",
        price: "$7.75",
        desc: "",
      },
      { name: "Battered Onion Rings", price: "$6.75", desc: "" },
      {
        name: "Zucchini Sticks",
        price: "$7.50",
        desc: "Deep-fried and served with ranch dip.",
      },
      {
        name: "Deep-Fried Pickles",
        price: "$7.50",
        desc: "Served with dip.",
      },
      {
        name: "Battered Mushrooms",
        price: "$7.50",
        desc: "Served with ranch dip.",
      },
      {
        name: "Single-Size Tray of Deep-Fried Appetizers",
        price: "$11.50",
        desc: "A tasty selection of deep-fried appetizers served with ranch dip.",
      },
      {
        name: "Chili Cheese Dog",
        price: "$7.50",
        desc: "A hot dog topped with homemade mild chili.",
      },
      {
        name: "Hot Dog",
        price: "$5.00",
        desc: "Long and delicious, served with mustard, ketchup, and relish.",
      },
    ],
  },
  {
    section: "Meals",
    note: "Deliciousness to make you smile!",
    items: [
      {
        name: "Donairs",
        price: "$11.00",
        desc: "Small — $11.00 · Regular — $14.00 · Large — $20.95. The best in town! Your choice of fresh crisp lettuce, tomatoes, onions, banana peppers, cheese, olives, pickles, and pineapple, topped with our own homemade sauces — sweet, garlic, or a combination of both.",
      },
      {
        name: "3 Chicken Strips & Fries",
        price: "$10.00",
        desc: "Three tender chicken strips served with fries and your choice of dip. Add an extra chicken strip — $3.50 · Exchange fries for onion rings — additional $2.00",
      },
      {
        name: "3 Chicken Strips & Poutine",
        price: "$13.75",
        desc: "Tender chicken strips with fries, cheese curds, and homemade gravy.",
      },
      {
        name: "Poutine",
        price: "$6.75",
        desc: "Small — $6.75 · Regular — $10.50. Crispy fries smothered in cheese curds and homemade gravy. Ketchup available.",
      },
      {
        name: "Donair Poutine",
        price: "$11.75",
        desc: "Crispy fries, donair meat, cheese curds, fresh tomatoes, onions, homemade gravy, and our sweet and garlic sauces. Add extra meat — $2.00",
      },
      {
        name: "Ukrainian Poutine",
        price: "$11.75",
        desc: "Crispy fries, perogies, bacon, fresh green onions, cheese curds, homemade gravy, and a dollop of sour cream.",
      },
      {
        name: "Hot Hamburger Sandwich",
        price: "$9.75",
        desc: "A homemade burger served on toasted Texas toast, smothered in homemade gravy and fried onions. Yum!",
      },
      {
        name: "Chicken Poutine",
        price: "$11.75",
        desc: "Crispy fries, chicken, cheese curds, and homemade gravy.",
      },
      {
        name: "Pulled Pork Poutine",
        price: "$11.75",
        desc: "Crispy fries, slow-cooked pulled pork, cheese curds, homemade gravy, and green onions.",
      },
      {
        name: "Taco in a Bag",
        price: "$8.75",
        desc: "Taco beef, fresh lettuce, tomatoes, and seasoned corn chips topped with salsa and sour cream.",
      },
      {
        name: "Wings",
        price: "$14.75",
        desc: "1 lb+ of real meat! Available in Salt & Pepper, Mild/Spicy, Barbecue, Teriyaki, Honey & Garlic, or Garlic Parmesan. Served with ranch dipping sauce and fresh carrot garnish.",
      },
    ],
  },
  {
    section: "Salads",
    items: [
      {
        name: "Caesar Salad with Garlic Toast",
        price: "$10.00",
        desc: "Add Chicken — $12.00. Romaine lettuce, bacon bits, Parmesan cheese, croutons, and our house Caesar dressing.",
      },
      {
        name: "Garden Salad",
        price: "$10.00",
        desc: "Add Chicken — $12.00. Iceberg lettuce, tomato, cucumber, onion, and carrot. Choice of mayo, Miracle Whip, or Italian dressing.",
      },
      {
        name: "Donair Salad",
        price: "$11.75",
        desc: "Iceberg lettuce, tomatoes, onions, olives, pickles, donair meat, and cheese with sweet and garlic dressing. Customize it by adding or removing any item you wish.",
      },
    ],
  },
  {
    section: "Homemade Burgers",
    note: "Real burgers, just the way you're craving them!",
    items: [
      {
        name: "Hamburger",
        price: "$9.00",
        desc: "Toasted bun, delicious burger, tomato, lettuce, onion, pickles, mustard, relish, and ketchup. You choose what you like! Add cheese — $2.00 · Add bacon — $2.00",
      },
      {
        name: "Hot Hamburger Sandwich",
        price: "$9.95",
        desc: "Homemade burger served on toasted Texas toast, smothered in gravy and fried onions. Yum!",
      },
      {
        name: "Donair Burger",
        price: "$13.75",
        desc: "Homemade burger, donair meat, cheese, onion, lettuce, tomato, pickle, and sweet and garlic sauce.",
      },
      {
        name: "Mushroom Burger",
        price: "$11.75",
        desc: "Homemade burger with lettuce, tomato, onion, fresh sautéed mushrooms, and homemade mushroom sauce.",
      },
      {
        name: "Chicken Burger",
        price: "$10.75",
        desc: "Chicken on a toasted bun with lettuce, tomato, onion, and mayo. Add pineapple for a sweet twist.",
      },
      {
        name: "The Big Perfect Game Burger",
        price: "$15.75",
        desc: "Two homemade patties, onion rings, fried egg, pickles, lettuce, tomato, cheese sticks, and our special gutter sauce — all on a fresh toasted bun. Big, delicious, and ready for the challenge!",
      },
      {
        name: "Extra Burger Patties",
        price: "$4.50",
        desc: "Each",
      },
    ],
  },
  {
    section: "Custom Burgers",
    note: "Tell us what you like and we'll build it your way! Available toppings include cheese, bacon, lettuce, tomato, onion, pickles, mustard, ketchup, relish, pineapple, olives, and banana peppers.",
    items: [],
  },
  {
    section: "Sandwiches",
    items: [
      {
        name: "BLT Sandwich",
        price: "$6.75",
        desc: "Four slices of crispy bacon, fresh tomatoes, lettuce, and mayo on toasted Texas bread. Add cheese — $2.00",
      },
      {
        name: "Grilled Cheese Sandwich",
        price: "$6.75",
        desc: "Two types of cheese grilled between two pieces of Texas bread, just like Mom made! Add bacon, onions, or pickles — $2.00",
      },
      {
        name: "Breakfast Egger",
        price: "$6.75",
        desc: "Good any time of day! Bacon, egg, tomatoes, lettuce, onions, and mayo on a toasted brioche bun.",
      },
    ],
  },
];

export interface PartyPackage {
  name: string;
  capacity: string;
  price: string;
  value?: string;
  tag?: string;
  includes: string[];
  note?: string;
}

export const PARTY_PACKAGES: PartyPackage[] = [
  {
    name: "Package 3 — Galaxy Bowl Party",
    capacity: "8–60 People",
    price: "$225.00 + GST",
    value: "$300.00 value",
    tag: "PRIVATE PARTY",
    includes: [
      "2 hours of unlimited bowling",
      "Party area rental",
      "6 lanes",
      "Pool tables",
      "Air hockey table",
      "Shoe rental",
      "3 L of pop or juice",
      "Water",
      "Party table set up with plates, cups, napkins, utensils, etc.",
      "Complimentary birthday gift",
      "Host helps with the party",
      "Mom/Dad coordinates the party",
    ],
    note: "See additional options available to add to your party package.",
  },
  {
    name: "Package 2 — Double Strike Party",
    capacity: "8–15 People",
    price: "$150.00 + GST",
    value: "$180.00 value",
    includes: [
      "1.5 hours of unlimited bowling",
      "Party area rental",
      "Balloons and decorations",
      "2 × 2 L of juice or pop",
      "Water",
      "Shoe rental",
      "3 lanes",
      "Party table set up for you with cups, plates, napkins, etc.",
      "Complimentary birthday gift",
      "Parent/Guardian coordinates the party",
    ],
    note: "See additional options available to add to your party package.",
  },
  {
    name: "Package 1 — Party With Me",
    capacity: "0–10 People",
    price: "$100.00 + GST",
    value: "$130.00 value",
    includes: [
      "1 hour of unlimited bowling",
      "Party area rental",
      "1 × 2 L of juice or pop",
      "Water",
      "Shoe rental",
      "2 lanes",
      "Party table at the lanes with plates, napkins, and cups",
      "Complimentary birthday gift",
      "Parent/Guardian coordinates the party",
    ],
    note: "See additional options available to add to your party package.",
  },
];

export const PARTY_EVENT_TYPES = [
  "Adult Parties",
  "Christmas Parties",
  "Family Gatherings",
  "Sports Teams",
  "Company Events",
  "Team Building",
  "Birthday Parties",
  "& More",
];

export const LANE_BOOKING = {
  title: "Just Want to Book Lanes & Seating?",
  intro:
    "You can also simply book the lanes and table-side seating for your group.",
  options: [
    {
      label: "Private party",
      price: "$125.00 per hour",
      detail: "Includes all 6 lanes.",
    },
    {
      label: "Per lane",
      price: "$37.00 per lane, per hour",
      detail: "+$2.00 shoe rental",
    },
  ],
  includes: [
    "6 lanes",
    "Pool tables",
    "Air hockey table",
    "Party host",
    "Table-side party seating",
  ],
  note: "See additional options available to add to your party package.",
};

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
