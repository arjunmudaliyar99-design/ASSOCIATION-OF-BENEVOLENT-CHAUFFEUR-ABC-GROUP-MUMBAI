export const site = {
  name: "ABC Group Mumbai",
  fullName: "Association of Benevolent Chauffeur Group Mumbai",
  motto: "To serve, to care, to uplift.",
  regNo: "MU/000566/2023",
  founded: "2 June 2023",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://abcgroupmumbai.org",
  address: "136, Subhash Nagar, Gaondevi, Vakola Pipe Line, Santacruz (E), Mumbai 400055",
  phone: "+91 98929 42264",
  phone2: "+91 98929 56995",
  whatsapp: "919892942264",
  email: "abcgroupmumbai@gmail.com",
  instagram: "abc_groupmumbai",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Subhash+Nagar+Vakola+Santacruz+East+Mumbai+400055",
};

/** Committee, in the order given by the association. Photos go in public/team/<n>.jpg */
export const leaders = [
  { n: 1, name: "Mohan Muthu", role: "founder" },
  { n: 2, name: "S. Ramachandran Nadar", role: "vicePresident" },
  { n: 3, name: "Durairaj Bhagwati Nadar", role: "secretary" },
  { n: 4, name: "Vigneshwaran", role: "treasurer" },
  { n: 5, name: "Murugan Udaiyar", role: "chiefAdvisor" },
  { n: 6, name: "Gandhi Rakkappan", role: "member" },
] as const;

/** Driver hire rates from the association's rate cards (₹). */
export const rates = {
  standard: { dailyHours: 8, daily: 1000, monthlyHours: 10, monthly: 30000, extra: 100, dinner: 200, travel: 200, outUnder: 1500, outOver: 1800 },
  luxury: { dailyHours: 10, daily: 1200, monthlyHours: 10, monthly: 35000, extra: 150, dinner: 250, travel: 250, outUnder: 1800, outOver: 2000 },
};

export const serviceKeys = ["social", "medical", "welfare", "orphanage", "sports"] as const;

export const nav = [
  { href: "/", key: "home" },
  { href: "/about", key: "about" },
  { href: "/our-work", key: "work" },
  { href: "/hire-a-driver", key: "rates" },
  { href: "/gallery", key: "gallery" },
  { href: "/join", key: "join" },
  { href: "/contact", key: "contact" },
] as const;

export const objectives = [
  { slug: "employment", title: "Employment support for drivers", body: "Driving jobs and duties for drivers, without charging any commission, so every opportunity is fair and transparent.", photo: "/photos/drivers-felicitation-bus-event/03.jpg" },
  { slug: "welfare", title: "Drivers' welfare", body: "Help with salary delays, payment disputes and problems at work, so no driver faces them alone.", photo: "/photos/drivers-felicitation-bus-event/13.jpg" },
  { slug: "education", title: "Education for children", body: "Notebooks, stationery and learning material for the children of our members.", photo: "/photos/childrens-home-visit/04.jpg" },
  { slug: "ashram", title: "Ashrams and needy children", body: "Food, groceries and essentials delivered to ashrams and children who need them.", photo: "/photos/ashram-food-seva/21.jpg" },
  { slug: "medical", title: "Medical and emergency help", body: "Money and support for members' families during medical emergencies, accidents and family crises, based on available resources.", photo: "/photos/home-visits-family-support/01.jpg" },
  { slug: "family", title: "Family welfare", body: "Welfare activities, humanitarian help and community programmes for the wellbeing of drivers' families.", photo: "/photos/team-moments/01.jpg" },
  { slug: "social", title: "Social service", body: "Food drives, grocery help and charity work for anyone in Mumbai who needs it.", photo: "/photos/grocery-supplies-drive/05.jpg" },
];

export const features = { has80G: false }; // set true once the trust confirms its 80G certificate

export const jobNetwork = { members: "800+", note: "A WhatsApp group where members share driving jobs with each other." };

export const causes = [
  { id: "general", label: "Where it's needed most" },
  { id: "education", label: "Children's education" },
  { id: "ashram", label: "Ashram meals" },
  { id: "medical", label: "Medical emergencies" },
  { id: "welfare", label: "Drivers' welfare" },
];
