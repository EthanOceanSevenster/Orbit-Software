/**
 * Sites we have built, and what clients have said about them.
 *
 * Everything here is observable: the screenshot comes from the live site, the
 * descriptions say what is actually on it, and nothing claims a result we
 * cannot show. No traffic numbers, no "sales up 40%", no invented reviews. A
 * prospect can click through and check every line of it, which is the point.
 */
export type ClientSite = {
  slug: string;
  name: string;
  url: string;
  /** Shown as a link, without the scheme. */
  display: string;
  sector: string;
  location: string;
  /** One line, for cards. */
  summary: string;
  /** The short version of what the site had to do. */
  brief: string[];
  /** What we built, in the language of somebody shopping for a website. */
  built: { title: string; text: string }[];
  /** For the card. The first three of `built`, said in three words each. */
  highlights: string[];
  /** Pages on the live site worth naming. */
  pages: string[];
  /** Screenshot of the live home page, in /public/work. */
  shot: string;
};

export const CLIENT_SITES: ClientSite[] = [
  {
    slug: "mimshack-wellness",
    name: "Mimshack Wellness",
    url: "https://www.mimschakwellness.com/",
    display: "mimschakwellness.com",
    sector: "Private social work practice",
    location: "Kraaifontein, Cape Town",
    summary:
      "Counselling, family mediation, trauma support and employee wellness, in person and by video call.",
    brief: [
      "A private practice where the first contact is a sensitive one. Somebody looking for counselling is not shopping around; they want to know who they would be talking to, what it costs them to ask, and how to make the first appointment without a phone call they are not ready for.",
      "The practice also sells employee wellness to companies, which is a different buyer entirely, reading for different reasons.",
    ],
    built: [
      {
        title: "Booking that does not need a phone call",
        text: "Visitors book a session on the site and get an account to manage it. For a first-time client, pressing a button is a great deal easier than making the call, and it means enquiries arrive while the practice is closed.",
      },
      {
        title: "A separate section for companies",
        text: "Employee wellness has its own page and its own language, so an HR manager is not reading copy written for somebody in crisis, and somebody in crisis is not reading a corporate pitch.",
      },
      {
        title: "WhatsApp, for the ones who will not fill in a form",
        text: "One tap to the practice's own number. It costs nothing to offer and it catches the enquiries that a contact form loses.",
      },
      {
        title: "Written to be found",
        text: "The site says what it does, where, and who runs it, in the words somebody would actually search for.",
      },
    ],
    highlights: [
      "Online booking with client accounts",
      "Separate corporate wellness section",
      "WhatsApp enquiries",
    ],
    pages: ["Home", "Services", "Why me", "Corporate wellness", "About", "Contact", "Book a session"],
    shot: "/work/mimshack-wellness.jpg",
  },
  {
    slug: "the-oak-families",
    name: "The Oak Families and Wellness",
    url: "https://theoakfamilies.org/",
    display: "theoakfamilies.org",
    sector: "Private social work practice",
    location: "Gqeberha",
    summary:
      "Counselling, coaching and psychosocial support for children, adolescents, parents, families and employees.",
    brief: [
      "The practice works with five quite different groups: children, adolescents, parents and families, employees, and individuals. A single services page would have made every one of them read four paragraphs that were not about them.",
      "It also needed to carry the credibility a private practice runs on, without reading as a brochure.",
    ],
    built: [
      {
        title: "A page per group, not a list",
        text: "Children, adolescents and youth, parents and families, employees and workplaces, and individuals each get their own page. A parent lands on the page written for parents and reads one thing.",
      },
      {
        title: "Session booking",
        text: "A booking page rather than a phone number alone, so the first step is something somebody can do at eleven at night.",
      },
      {
        title: "The approach, in plain words",
        text: "A page explaining how the practice works, which is what people read when they are deciding whether to trust somebody with their family.",
      },
      {
        title: "Built to be found locally",
        text: "Structured so that somebody searching for a social worker in Gqeberha finds the practice rather than a directory listing.",
      },
    ],
    highlights: ["A page per service, by who it is for", "Session booking", "Built to be found on Google"],
    pages: ["Home", "About", "Services", "Approach", "Contact", "Book a session"],
    shot: "/work/the-oak-families.jpg",
  },
];

export function clientBySlug(slug: string): ClientSite | undefined {
  return CLIENT_SITES.find((client) => client.slug === slug);
}

export type Testimonial = {
  /** Exactly what they wrote or said. Never paraphrased, never written for them. */
  quote: string;
  name: string;
  role: string;
  /** The slug of the client site this came from. */
  client?: string;
};

/**
 * Empty until a client sends words we can quote.
 *
 * The section hides itself while this is empty, so the page never shows an
 * empty "what clients say" heading, and we never have to make one up to fill
 * the space.
 */
export const TESTIMONIALS: Testimonial[] = [];
