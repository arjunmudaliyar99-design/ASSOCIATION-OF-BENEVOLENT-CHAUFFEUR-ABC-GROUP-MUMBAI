export const site = {
  name: "ABC Group Mumbai",
  fullName: "Association of Benevolent Chauffeur Group Mumbai",
  motto: "To serve, to care, to uplift.",
  regNo: "MU/000566/2023",
  founded: "2 June 2023",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://abcgroupmumbai.org",
  address: "136, Subhash Nagar, Gaondevi, Vakola Pipe Line, Santacruz (E), Mumbai 400055",
  phone: "+91 98929 42264",
  whatsapp: "919892942264",
  email: "abcgroupmumbai@gmail.com",
  instagram: "abc_groupmumbai",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Subhash+Nagar+Vakola+Santacruz+East+Mumbai+400055",
};

export const nav = [
  { href: "/about", label: "About" },
  { href: "/our-work", label: "Our work" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export const objectives = [
  { slug: "employment", title: "Employment support for drivers", body: "Driving jobs and duties for drivers, with no commission charged. Fair and open, every time.", photo: "/photos/drivers-felicitation-bus-event/04.jpg" },
  { slug: "welfare", title: "Drivers' welfare", body: "Help with salary delays, payment disputes and problems at work, so no driver faces them alone.", photo: "/photos/drivers-felicitation-bus-event/02.jpg" },
  { slug: "education", title: "Education for children", body: "Notebooks, stationery and learning material for the children of our members.", photo: "/photos/childrens-home-visit/04.jpg" },
  { slug: "ashram", title: "Ashrams and needy children", body: "Food, groceries and essentials delivered to ashrams and children who need them.", photo: "/photos/ashram-food-seva/03.jpg" },
  { slug: "medical", title: "Medical and emergency help", body: "Money and support for members' families during illness, accidents and sudden crises.", photo: "/photos/home-visits-family-support/01.jpg" },
  { slug: "family", title: "Family welfare", body: "Welfare programmes that look after the wellbeing of drivers' families.", photo: "/photos/team-moments/01.jpg" },
  { slug: "social", title: "Social service", body: "Food drives, grocery help and charity work for anyone in Mumbai who needs it.", photo: "/photos/grocery-supplies-drive/01.jpg" },
];

export const causes = [
  { id: "general", label: "Where it's needed most" },
  { id: "education", label: "Children's education" },
  { id: "ashram", label: "Ashram meals" },
  { id: "medical", label: "Medical emergencies" },
  { id: "welfare", label: "Drivers' welfare" },
];
