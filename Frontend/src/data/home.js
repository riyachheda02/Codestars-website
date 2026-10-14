import bloodBytesImg from '../assets/events photo/bloody_bites.webp';
import codeUncodeImg from '../assets/events photo/code_uncode_poolprize.webp';
import bountyImg from '../assets/events photo/bounty.webp';
import mockContestImg from '../assets/events photo/MOCK_CONTEST .webp';
import feContestImg from '../assets/events photo/FE_CONTEST.webp';
import icpcImg from '../assets/events photo/icpc_logo.png';
import cfgImg from '../assets/events photo/cfg.webp';

/**
 * Helper to check whether an ISO or YYYY-MM-DD date is in the future.
 * Ensures past events are NEVER labeled as upcoming.
 */
export function isEventUpcoming(dateString) {
  if (!dateString) return false;
  const eventDate = new Date(dateString);
  const now = new Date();
  return eventDate.getTime() > now.getTime();
}

export const heroData = {
  prefix: 'DJS',
  title: 'CodeStars',
  tagline: 'COMMUNITY OF BUILDERS & COMPETITIVE PROGRAMMERS, TELLING STORIES THROUGH CODE.',
  scrollCueText: 'SCROLL TO EXPLORE',
};

export const whatWeAreData = {
  eyebrow: 'WHAT WE ARE',
  heading: 'Engineering algorithmic excellence through passion, rigor, and community.',
  description:
    'DJS CodeStars is the premier competitive programming committee of Dwarkadas J. Sanghvi College of Engineering, dedicated to nurturing sharp analytical minds and ICPC contenders.',
  pillars: [
    {
      id: 'pillar-contests',
      icon: 'Trophy',
      title: 'ICPC & Solo Contests',
      description: 'High-stakes algorithmic battles, simulated rounds, and real-time leaderboards.',
    },
    {
      id: 'pillar-training',
      icon: 'GraduationCap',
      title: 'Rigorous Training',
      description: 'Deep-dive data structure masterclasses, algorithmic workshops, and post-contest editorials.',
    },
    {
      id: 'pillar-community',
      icon: 'Users',
      title: 'Vibrant Community',
      description: 'A close-knit network of passionate coders, mentors, and alumni at top tech firms.',
    },
  ],
};

export const featuredEventsData = [
  {
    id: 'code-uncode',
    title: 'Code UnCode Championship',
    subtitle: 'Mumbai Premier ICPC-Style Showdown',
    date: '2025-02-15',
    displayDate: 'February 2025',
    location: 'Mumbai',
    image: codeUncodeImg,
    description: "Mumbai's premier ICPC-style solo coding championship uniting 2000+ participants from 500+ institutes.",
    badge: 'Flagship Event',
    actionUrl: '#events',
    isExternal: false,
  },
  {
    id: 'code-bounty',
    title: 'Code Bounty Challenge',
    subtitle: 'Intra-College Coding Faceoff',
    date: '2026-11-20', // Future date for demonstration of upcoming badge
    displayDate: 'November 2026',
    location: 'DJSCE Labs',
    image: bountyImg,
    description: 'A thrilling two-round coding contest testing rapid problem decomposition and algorithmic agility.',
    badge: 'Flagship Event',
    actionUrl: '#events',
    isExternal: false,
  },
  {
    id: 'bloodbytes',
    title: 'BloodBytes Halloween Showdown',
    subtitle: 'High-Octane Themed Coding Arena',
    date: '2025-10-31',
    displayDate: 'October 2025',
    location: 'IT Dept, DJSCE',
    image: bloodBytesImg,
    description: 'Electrifying night of spooky algorithmic problem-solving with lightning rounds and exciting prizes.',
    badge: 'Halloween Special',
    actionUrl: '#events',
    isExternal: false,
  },
  {
    id: 'mock-contest',
    title: 'MOCK CONTEST',
    subtitle: 'Simulated ICPC Environment',
    date: '2025-10-03',
    displayDate: 'October 2025',
    location: 'IT Dept, DJSCE',
    image: mockContestImg,
    description: 'Sharpen competitive instincts under realistic contest conditions with live analysis.',
    badge: 'New Event',
    actionUrl: 'https://codeforces.com/group/g6lZJwfgjF',
    isExternal: true,
  },
  {
    id: 'icpc-camp',
    title: 'ICPC Advanced Camp',
    subtitle: 'Advanced Problem Solving Bootcamps',
    date: '2026-12-10', // Future date
    displayDate: 'December 2026',
    location: 'DJSCE Campus',
    image: icpcImg,
    description: 'Intensive multi-day bootcamp mentoring students on advanced trees, flows, and DP optimizations.',
    badge: 'Premium Camp',
    actionUrl: '#events',
    isExternal: false,
  },
  {
    id: 'coffee-googlers',
    title: 'Coffee-with-Googlers',
    subtitle: 'Exclusive AMA & Mentorship',
    date: '2025-08-20',
    displayDate: 'August 2025',
    location: 'Online Seminar',
    image: cfgImg,
    description: 'Direct interaction with Google software engineers discussing interview mastery and ICPC benefits.',
    badge: 'Interaction Series',
    actionUrl: '#events',
    isExternal: false,
  },
];


/* 5. Announcements Data */
export const announcementsData = [
  {
    id: 'ann-1',
    date: { month: 'MAR', day: '24', year: '2026' },
    dateIso: '2026-03-24',
    type: 'UPDATE',
    title: 'Schedule Update: Introduction to CodeStars Rescheduled!',
    shortDesc: "Important Update! The Introduction to CodeStars session has been rescheduled. Mark your calendars and don't miss this exciting opportunity!",
    fullDesc: 'We apologize for any inconvenience caused by this schedule change. The new timing will allow more students to attend and learn about the exciting opportunities at CodeStars. All other events remain as scheduled. We look forward to seeing you there!',
    linkUrl: '#events',
    linkText: 'View Events Schedule',
  },
  {
    id: 'ann-2',
    date: { month: 'OCT', day: '01', year: '2025' },
    dateIso: '2025-10-01',
    type: 'EVENT',
    title: '🚀 Codestars is Recruiting Co-Committee Members!',
    shortDesc: 'Want to be part of the premier Competitive Programming committee? Applications open for Technical, Tech-Editorial, Creatives, and Marketing roles.',
    fullDesc: "We're not just about code—we're about building a community where logic meets creativity. From CP practice sessions to coding contests and collab events, Codestars does it all! Connect with fellow coding enthusiasts and gain leadership experience.",
    linkUrl: 'https://forms.gle/zSQRxwb3vysxrAqS8',
    linkText: 'Application Form',
  },
  {
    id: 'ann-3',
    date: { month: 'OCT', day: '03', year: '2025' },
    dateIso: '2025-10-03',
    type: 'EVENT',
    title: '🚀 Mock Contest - Exclusively for 2nd Years!',
    shortDesc: "Sharpen your algorithmic thinking in our upcoming mock ICPC round with custom problem sets and post-contest discussions.",
    fullDesc: 'Test and sharpen your competitive programming instincts in an ICPC simulated environment with live standings and post-contest problem discussions curated by senior division coders.',
    linkUrl: 'https://codeforces.com/group/g6lZJwfgjF',
    linkText: 'Codeforces Contest Page',
  },
];

/* 6. Footer Data */
export const footerData = {
  mission: 'The official competitive programming committee of DJSCE, organizing ICPC-style contests and workshops to foster coding culture and excellence.',
  navigation: [
    { label: 'Home', target: 'home', hash: '#home' },
    { label: 'Events', target: 'events', hash: '#events' },
    { label: 'Resources', target: 'resources', hash: '#resources' },
    { label: 'Team', target: 'team', hash: '#team' },
    { label: 'Gallery Archive', target: 'gallery', hash: '#gallery' },
    { label: 'Code UnCode ↗', url: 'https://codeuncode.djscodestars.in/', external: true },
  ],
  socials: [
    { name: 'Instagram', url: 'https://www.instagram.com/djsce_codestars/' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/company/djs-codestars/' },
    { name: 'Discord', url: 'https://discord.com/' },
    { name: 'YouTube', url: 'https://www.youtube.com/@djscodestars' },
  ],
  contact: {
    phones: ['+91 89285 27980', '+91 93216 00186'],
    email: 'djscodestars@gmail.com',
    address: 'DJ Sanghvi College of Engineering, Vile Parle West, Mumbai - 400056',
  },
};
