/* ============================================================
   THE BRIVIA CLUB — in-app mock data
   One consistent cast of builders powers every surface, so the
   product feels like a living network, not lorem ipsum.
   ============================================================ */

const u = (id, w = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

/* ---------- the signed-in member ---------- */
export const ME = {
  name: 'Mohit Yadav',
  first: 'Mohit',
  role: 'Full-Stack Engineer',
  campus: 'IIT Delhi',
  location: 'New Delhi, India',
  timezone: 'IST (UTC+5:30)',
  avatar: u('photo-1506794778202-cad84cf45f1d', 300),
  cover: u('photo-1519389950473-47ba0277781c', 1600),
  bio: 'Full-stack engineer building AI products. 3× hackathon winner, currently exploring healthcare AI. I ship fast, document well, and never ghost a team.',
  headline: 'Building an AI healthcare startup — looking for a design co-founder.',
  skills: ['React', 'Node.js', 'Python', 'LLMs', 'PostgreSQL', 'AWS', 'Docker', 'FastAPI'],
  interests: ['AI', 'Healthcare', 'Open Source', 'Hackathons', 'Chess'],
  languages: ['English', 'Hindi'],
  experience: [
    { role: 'Founding Engineer', org: 'MediGraph AI', span: '2025 — present', text: 'Built the clinical-notes summarizer end to end — RAG pipeline, HIPAA-safe infra, React front-end.' },
    { role: 'SDE Intern', org: 'Razorpay', span: 'Summer 2024', text: 'Shipped payment-retry orchestration that lifted success rate by 4.2% on UPI rails.' },
  ],
  education: [{ school: 'IIT Delhi', degree: 'B.Tech, Computer Science', span: '2021 — 2025' }],
  achievements: ['Winner — HackBengaluru \'26', 'Finalist — Smart India Hackathon', 'GSoC \'24 — CNCF'],
  certifications: ['AWS Solutions Architect Associate', 'DeepLearning.AI LLM Specialization'],
  startup: { stage: 'Idea → MVP', name: 'MediGraph AI', looking: 'Design co-founder' },
  company: 'MediGraph AI (stealth)',
  openToWork: false,
  openToCollab: true,
  availability: 'Evenings + weekends · ~15 hrs/wk',
  workStyle: 'Async-first, sprint bursts',
  personality: ['Driven', 'Direct', 'Detail-oriented'],
  industries: ['Healthcare', 'Fintech', 'DevTools'],
  socials: { github: 'github.com/mohityadav', linkedin: 'linkedin.com/in/mohityadav', portfolio: 'mohit.build' },
  profileStrength: 86,
  verified: { email: true, phone: true, github: true, linkedin: true, college: true, company: false },
  badges: ['verified', 'founder', 'hackathon-winner'],
}

/* ---------- badges / reputation ---------- */
export const BADGES = {
  verified: { label: 'Verified', icon: 'shield', hint: 'Identity confirmed via college email + GitHub' },
  founder: { label: 'Founder', icon: 'rocket', hint: 'Runs a registered or active startup' },
  'hackathon-winner': { label: 'Hackathon Winner', icon: 'trophy', hint: 'Verified win at a partner event' },
  'top-mentor': { label: 'Top Mentor', icon: 'star', hint: 'Rated 4.8+ by 10+ mentees' },
  musician: { label: 'Musician', icon: 'music', hint: 'Active in the Music Hub with verified performances' },
  creator: { label: 'Creator', icon: 'palette', hint: 'Published creative work on the platform' },
  premium: { label: 'Premium', icon: 'gem', hint: 'Brivia Premium member' },
}

/* ---------- people (used across every surface) ---------- */
export const PEOPLE = [
  {
    id: 'sara', name: 'Sara Khan', role: 'Product Designer', org: 'NID Ahmedabad',
    tag: 'Startup', match: 96, img: u('photo-1494790108377-be9c29b29330'),
    bio: 'UX-obsessed designer who loves 0-to-1 products. Seeking a technical co-founder for a healthtech idea.',
    skills: ['Figma', 'UX Research', 'Branding', 'Design Systems'],
    lookingFor: 'Technical co-founder', availability: '20 hrs/wk', location: 'Ahmedabad', tz: 'IST',
    communities: ['Design', 'Startups'], badges: ['verified', 'creator'], video: true, online: true,
    why: ['Both building in healthcare', 'Design completes your stack', 'Same timezone', 'Startup-stage aligned', 'Similar working hours'],
  },
  {
    id: 'aarav', name: 'Aarav Mehta', role: 'Full-Stack Engineer', org: 'IIT Bombay',
    tag: 'Hackathon', match: 92, img: u('photo-1507003211169-0a1dd7228f2d'),
    bio: 'Shipped 3 hackathon wins. Looking for a designer + PM to build an AI note-taker this weekend.',
    skills: ['React', 'Node', 'LLMs', 'Postgres'],
    lookingFor: 'Hackathon squad', availability: 'Weekends', location: 'Mumbai', tz: 'IST',
    communities: ['AI', 'Hackathons'], badges: ['verified', 'hackathon-winner'], video: true, online: true,
    why: ['Both love AI', 'Complementary skills', 'Same timezone', 'Both hackathon-driven', 'Ships on weekends like you'],
  },
  {
    id: 'rohan', name: 'Rohan Verma', role: 'ML Engineer', org: 'Google',
    tag: 'Side Project', match: 89, img: u('photo-1500648767791-00dcc994a43e'),
    bio: 'Deep learning by day. Want to build an open-source RAG tool with a couple of driven builders.',
    skills: ['PyTorch', 'RAG', 'Python', 'MLOps'],
    lookingFor: 'Open-source collaborators', availability: 'Evenings', location: 'Bangalore', tz: 'IST',
    communities: ['AI', 'Open Source'], badges: ['verified', 'top-mentor'], video: false, online: false,
    why: ['Both love AI', 'ML depth complements your full-stack', 'Open-source overlap', 'Same timezone'],
  },
  {
    id: 'ananya', name: 'Ananya Rao', role: 'Growth & Marketing', org: 'IIM Ahmedabad',
    tag: 'Startup', match: 87, img: u('photo-1438761681033-6461ffad8d80'),
    bio: 'Took a D2C brand to 6-figures. Looking to partner with makers who need go-to-market firepower.',
    skills: ['Growth', 'SEO', 'Content', 'Analytics'],
    lookingFor: 'Technical founding team', availability: '15 hrs/wk', location: 'Ahmedabad', tz: 'IST',
    communities: ['Startups'], badges: ['verified', 'founder'], video: true, online: true,
    why: ['GTM completes your stack', 'Startup-stage aligned', 'Same timezone', 'Both founder-minded'],
  },
  {
    id: 'dev', name: 'Dev Patel', role: 'Backend Engineer', org: 'BITS Pilani',
    tag: 'Hackathon', match: 84, img: u('photo-1519345182560-3f2917c472ef'),
    bio: 'Backend nerd who lives on coffee and Docker. Free every weekend for a serious hackathon squad.',
    skills: ['Go', 'Docker', 'AWS', 'GraphQL'],
    lookingFor: 'Hackathon teammates', availability: 'Weekends', location: 'Pilani', tz: 'IST',
    communities: ['Hackathons', 'Open Source'], badges: ['verified'], video: false, online: true,
    why: ['Infra depth complements you', 'Both hackathon-driven', 'Same timezone', 'Weekend availability match'],
  },
  {
    id: 'meera', name: 'Meera Nair', role: 'Vocalist & Songwriter', org: 'Berklee Online',
    tag: 'Music', match: 81, img: u('photo-1534528741775-53994a69daeb'),
    bio: 'Indie-pop vocalist with 40+ live shows. Forming a band for the college circuit — need guitar + keys.',
    skills: ['Vocals', 'Songwriting', 'Ableton', 'Stage Performance'],
    lookingFor: 'Guitarist & keyboardist', availability: 'Evenings', location: 'Kochi', tz: 'IST',
    communities: ['Music'], badges: ['verified', 'musician'], video: true, online: false,
    why: ['You listed guitar under interests', 'Practice schedule overlaps', 'Same timezone', 'Both gig-ready'],
  },
  {
    id: 'kabir', name: 'Kabir Singh', role: 'Video Editor & Motion', org: 'Freelance',
    tag: 'Creator', match: 78, img: u('photo-1472099645785-5658abf4ff4e'),
    bio: 'Edited 200+ videos for creators with 1M+ subs. Looking for a startup that needs a content engine.',
    skills: ['Premiere', 'After Effects', 'Storyboarding', 'YouTube'],
    lookingFor: 'Startup content role', availability: 'Full-time', location: 'Delhi', tz: 'IST',
    communities: ['Creators', 'Design'], badges: ['verified', 'creator'], video: true, online: true,
    why: ['Content completes your launch plan', 'Same city — can meet IRL', 'Availability aligned'],
  },
  {
    id: 'isha', name: 'Isha Gupta', role: 'Data Scientist', org: 'Microsoft',
    tag: 'Mentor', match: 90, img: u('photo-1517841905240-472988babdf9'),
    bio: 'DS @ Microsoft, ex-Flipkart. I mentor 2 builders per quarter on ML systems and career strategy.',
    skills: ['ML Systems', 'SQL', 'Career Coaching', 'A/B Testing'],
    lookingFor: 'Mentees in ML', availability: '2 hrs/wk', location: 'Hyderabad', tz: 'IST',
    communities: ['AI'], badges: ['verified', 'top-mentor', 'premium'], video: false, online: true,
    why: ['Mentors in your target field', 'Healthcare-ML experience', 'Same timezone', 'High mentee ratings'],
  },
  {
    id: 'arjun', name: 'Arjun Iyer', role: 'Drummer & Producer', org: 'True School of Music',
    tag: 'Music', match: 76, img: u('photo-1539571696357-5a69c17a67c6'),
    bio: 'Session drummer, 8 years behind the kit. Producing an indie EP — looking for a bassist and a violinist.',
    skills: ['Drums', 'Logic Pro', 'Mixing', 'Live Sound'],
    lookingFor: 'Bassist & violinist', availability: 'Weekends', location: 'Mumbai', tz: 'IST',
    communities: ['Music'], badges: ['musician'], video: true, online: false,
    why: ['Rhythm section fits your band plan', 'Weekend practice overlap', 'Same timezone'],
  },
  {
    id: 'zoya', name: 'Zoya Sheikh', role: 'iOS Engineer', org: 'Swiggy',
    tag: 'Side Project', match: 83, img: u('photo-1524504388940-b1c1722653e1'),
    bio: 'iOS engineer who ships polished apps. Want to build a habit tracker with an ML twist on the side.',
    skills: ['Swift', 'SwiftUI', 'CoreML', 'Firebase'],
    lookingFor: 'Backend + design partner', availability: 'Evenings', location: 'Bangalore', tz: 'IST',
    communities: ['AI', 'Design'], badges: ['verified'], video: false, online: true,
    why: ['Mobile completes your stack', 'Both ship side projects', 'Same timezone', 'Evening availability match'],
  },
  {
    id: 'nikhil', name: 'Nikhil Bose', role: 'Product Manager', org: 'ISB Hyderabad',
    tag: 'Startup', match: 80, img: u('photo-1506794778202-cad84cf45f1d'),
    bio: 'Ex-founder (acquihired). PM by training, builder by habit. Scouting my next 0-to-1 team.',
    skills: ['Product Strategy', 'User Research', 'Roadmapping', 'Pitching'],
    lookingFor: 'Founding team', availability: 'Full-time', location: 'Hyderabad', tz: 'IST',
    communities: ['Startups'], badges: ['verified', 'founder'], video: true, online: false,
    why: ['Product sense completes your stack', 'Founder experience', 'Startup-stage aligned'],
  },
  {
    id: 'tara', name: 'Tara Menon', role: 'Illustrator & Writer', org: 'Srishti Institute',
    tag: 'Creator', match: 74, img: u('photo-1544005313-94ddf0286df2'),
    bio: 'Illustrator and long-form writer. Building a webcomic — need a developer for an interactive reader.',
    skills: ['Procreate', 'Storytelling', 'Copywriting', 'Zines'],
    lookingFor: 'Creative developer', availability: '10 hrs/wk', location: 'Bangalore', tz: 'IST',
    communities: ['Creators', 'Design'], badges: ['creator'], video: false, online: true,
    why: ['Wants exactly your dev skills', 'Creative-project overlap', 'Same timezone'],
  },
]

export const byId = (id) => PEOPLE.find((p) => p.id === id)

/* ---------- communities ---------- */
export const COMMUNITIES = [
  { id: 'ai', name: 'AI Builders', members: 4820, posts: 128, icon: 'bot', joined: true, trending: true, blurb: 'LLMs, agents, RAG pipelines and everything in between.', banner: u('photo-1620712943543-bcc4688e7485', 900) },
  { id: 'hackathons', name: 'Hackathons', members: 6210, posts: 214, icon: 'zap', joined: true, trending: true, blurb: 'Team calls, event radars and post-mortems from the circuit.', banner: u('photo-1504384308090-c894fdcc538d', 900) },
  { id: 'startups', name: 'Startups', members: 3940, posts: 96, icon: 'rocket', joined: true, trending: true, blurb: 'From idea validation to term sheets — founders helping founders.', banner: u('photo-1559136555-9303baea8ebd', 900) },
  { id: 'music', name: 'Music', members: 2180, posts: 87, icon: 'music', joined: false, trending: false, blurb: 'Bands forming, jams happening, EPs shipping.', banner: u('photo-1511671782779-c97d3d27a1d4', 900) },
  { id: 'photography', name: 'Photography', members: 1730, posts: 54, icon: 'camera', joined: false, trending: false, blurb: 'Photo walks, critique threads and collab shoots.', banner: u('photo-1452587925148-ce544e77e70d', 900) },
  { id: 'gaming', name: 'Gaming', members: 2890, posts: 143, icon: 'gamepad', joined: false, trending: true, blurb: 'Game jams, esports squads and indie dev logs.', banner: u('photo-1552820728-8b83bb6b773f', 900) },
  { id: 'design', name: 'Design', members: 3110, posts: 102, icon: 'palette', joined: true, trending: false, blurb: 'Portfolio reviews, design systems and craft talk.', banner: u('photo-1561070791-2526d30994b5', 900) },
  { id: 'opensource', name: 'Open Source', members: 2560, posts: 77, icon: 'git', joined: false, trending: false, blurb: 'Maintainers recruiting contributors for defined scopes.', banner: u('photo-1556075798-4825dfaaf498', 900) },
  { id: 'chess', name: 'Chess', members: 940, posts: 31, icon: 'crown', joined: false, trending: false, blurb: 'Blitz nights, campus tournaments and study groups.', banner: u('photo-1529699211952-734e80c4d42b', 900) },
]

export const COMMUNITY_POSTS = [
  { id: 1, community: 'ai', author: 'rohan', time: '2h', title: 'Benchmarked 6 open embedding models on Hindi text — results inside', body: 'TL;DR: bge-m3 wins on recall, e5-large on latency. Full notebook linked. Happy to pair with anyone building Indic RAG.', likes: 84, replies: 23, kind: 'Discussion' },
  { id: 2, community: 'hackathons', author: 'aarav', time: '5h', title: 'SIH \'26 registration closes Friday — 2 slots left on our team', body: 'We have full-stack + ML covered. Need a designer and a domain expert in agritech. Ping me or apply via the team card.', likes: 61, replies: 40, kind: 'Team Call' },
  { id: 3, community: 'startups', author: 'ananya', time: '1d', title: 'Resource: the exact cold-email template that got us 12 pilot users', body: 'Sharing the template + follow-up cadence we used for PayFlow. Steal it, adapt it, report back.', likes: 132, replies: 35, kind: 'Resource' },
  { id: 4, community: 'music', author: 'meera', time: '1d', title: 'Kochi jam session this Saturday — vocalist looking for a full lineup', body: 'Booked a rehearsal room 4–8pm. Indie/pop setlist. Guitar, keys, bass, drums — claim your spot.', likes: 47, replies: 18, kind: 'Event' },
]

/* ---------- events ---------- */
export const EVENTS = [
  { id: 'hackbengaluru', kind: 'Hackathon', name: 'HackBengaluru \'26', date: 'Jul 18–20', location: 'Bangalore · In person', going: 1240, prize: '₹12L prize pool', img: u('photo-1504384308090-c894fdcc538d', 900), rsvp: true, featured: true, blurb: 'South India\'s biggest student hackathon. 48 hours, 300 teams, AI + fintech + climate tracks.' },
  { id: 'sih', kind: 'Hackathon', name: 'Smart India Hackathon', date: 'Aug 02–03', location: 'Pan-India · Hybrid', going: 4820, prize: 'National finals', img: u('photo-1517245386807-bb43f82c33c4', 900), rsvp: false, featured: true, blurb: 'The whale. Teams of 6, government problem statements, national spotlight.' },
  { id: 'pitchnight', kind: 'Pitch Night', name: 'Delhi Pitch Night', date: 'Jul 12', location: 'New Delhi · In person', going: 180, prize: 'Angel audience', img: u('photo-1540575467063-178a50c2df87', 900), rsvp: true, featured: false, blurb: '8 teams, 5 minutes each, 3 angels in the room. Winner gets a fast-track intro.' },
  { id: 'jamsession', kind: 'Jam Session', name: 'Indie Jam — Kochi', date: 'Jul 11', location: 'Kochi · In person', going: 42, prize: null, img: u('photo-1493225457124-a3eb161ffa5f', 900), rsvp: false, featured: false, blurb: 'Open jam for the Music Hub. Bring your instrument, leave with a band.' },
  { id: 'techtalk', kind: 'Tech Talk', name: 'Scaling RAG in Production', date: 'Jul 15 · Online', location: 'Zoom · Online', going: 890, prize: null, img: u('photo-1591115765373-5207764f72e7', 900), rsvp: false, featured: false, blurb: 'Isha Gupta (Microsoft) on chunking strategies, eval harnesses and cost control.' },
  { id: 'designworkshop', kind: 'Workshop', name: 'Design Systems 101', date: 'Jul 22 · Online', location: 'Figma · Online', going: 460, prize: null, img: u('photo-1561070791-2526d30994b5', 900), rsvp: false, featured: false, blurb: 'Hands-on workshop: tokens, primitives and a component library from scratch.' },
]

/* ---------- hackathon hub ---------- */
export const HACKATHON_TEAMS = [
  { id: 1, name: 'AgriSense', event: 'Smart India Hackathon', looking: ['Designer', 'Agritech expert'], members: ['aarav', 'dev', 'zoya', 'rohan'], stack: ['React', 'FastAPI', 'YOLOv8'], spots: 2 },
  { id: 2, name: 'PayLater Guard', event: 'HackBengaluru \'26', looking: ['ML Engineer'], members: ['ananya', 'nikhil'], stack: ['Next.js', 'Python'], spots: 1 },
  { id: 3, name: 'MedScan', event: 'HackBengaluru \'26', looking: ['Full-stack', 'Designer', 'PM'], members: ['isha'], stack: ['PyTorch', 'FHIR'], spots: 3 },
]

export const LEADERBOARD = [
  { rank: 1, person: 'aarav', points: 2840, wins: 3 },
  { rank: 2, person: 'isha', points: 2410, wins: 2 },
  { rank: 3, person: 'dev', points: 2180, wins: 2 },
  { rank: 4, person: 'sara', points: 1930, wins: 1 },
  { rank: 5, person: 'rohan', points: 1720, wins: 1 },
]

/* ---------- projects marketplace ---------- */
export const PROJECTS = [
  { id: 1, name: 'OpenRAG — open-source RAG toolkit', owner: 'rohan', banner: u('photo-1461749280684-dccba630e2f6', 900), roles: ['Frontend dev', 'Tech writer'], stack: ['Python', 'React', 'LangChain'], timeline: '8 weeks', difficulty: 'Intermediate', pay: 'Unpaid · OSS', equity: null, applicants: 24, blurb: 'A batteries-included RAG library for Indic languages. 900 GitHub stars and climbing.' },
  { id: 2, name: 'PayFlow v2 — UPI analytics for D2C', owner: 'ananya', banner: u('photo-1551288049-bebda4e38f71', 900), roles: ['Backend dev', 'Data engineer'], stack: ['Go', 'ClickHouse', 'Next.js'], timeline: '12 weeks', difficulty: 'Advanced', pay: 'Paid · ₹40k/mo', equity: '0.5–1%', applicants: 41, blurb: 'Post-hackathon startup, angel-funded. Building the dashboard 400 D2C brands asked for.' },
  { id: 3, name: 'Habitual — ML habit tracker (iOS)', owner: 'zoya', banner: u('photo-1512941937669-90a1b58e7e9c', 900), roles: ['Backend dev', 'Designer'], stack: ['Swift', 'FastAPI', 'CoreML'], timeline: '6 weeks', difficulty: 'Beginner-friendly', pay: 'Unpaid · Side project', equity: null, applicants: 17, blurb: 'A habit tracker that predicts when you\'ll break a streak — and intervenes.' },
  { id: 4, name: 'InkTales — interactive webcomic reader', owner: 'tara', banner: u('photo-1618004912476-29818d81ae2e', 900), roles: ['Creative developer'], stack: ['React', 'GSAP', 'Canvas'], timeline: '10 weeks', difficulty: 'Intermediate', pay: 'Rev-share', equity: null, applicants: 9, blurb: 'Scroll-driven storytelling engine for illustrated fiction. Art is done; needs code.' },
]

/* ---------- hiring ---------- */
export const JOBS = [
  { id: 1, title: 'Founding Engineer', org: 'PayFlow', type: 'Equity + salary', mode: 'Bangalore · Hybrid', pay: '₹18–28 LPA + 1.5%', tags: ['Go', 'React', 'Fintech'], posted: '2d', applicants: 38, hot: true },
  { id: 2, title: 'ML Intern', org: 'MediGraph AI', type: 'Internship', mode: 'Remote', pay: '₹35k/mo', tags: ['PyTorch', 'RAG', 'Healthcare'], posted: '4d', applicants: 92, hot: true },
  { id: 3, title: 'Product Designer', org: 'Habitual', type: 'Freelance', mode: 'Remote', pay: '₹60k · 6-week contract', tags: ['Figma', 'iOS', 'Design Systems'], posted: '1w', applicants: 27, hot: false },
  { id: 4, title: 'DevRel Engineer', org: 'OpenRAG', type: 'Part-time', mode: 'Remote', pay: 'Grant-funded · ₹25k/mo', tags: ['Python', 'Writing', 'OSS'], posted: '1w', applicants: 15, hot: false },
  { id: 5, title: 'Growth Associate', org: 'Unstop-partner studio', type: 'Full-time', mode: 'Delhi · In office', pay: '₹8–12 LPA', tags: ['SEO', 'Content', 'B2C'], posted: '2w', applicants: 54, hot: false },
]

/* ---------- messaging ---------- */
export const CONVERSATIONS = [
  {
    id: 'sara', unread: 2, lastAt: '09:42',
    thread: [
      { from: 'them', at: 'Yesterday 22:10', text: 'Hey Mohit! 96% match — the algorithm clearly knows something 😄' },
      { from: 'me', at: 'Yesterday 22:14', text: 'Ha! I saw you\'re designing for healthtech — I\'m building MediGraph, an AI clinical-notes tool.' },
      { from: 'them', at: 'Yesterday 22:20', text: 'No way. I literally have 30 screens of a patient-summary concept in Figma. Want to see?' },
      { from: 'me', at: 'Yesterday 22:21', text: 'Absolutely. And here\'s the API shape I\'m working with:' },
      { from: 'me', at: 'Yesterday 22:21', code: 'GET /api/v1/patients/:id/summary\n{\n  "summary": string,\n  "confidence": number,\n  "sources": ClinicalNote[]\n}' },
      { from: 'them', at: '09:40', text: 'Clean. I can design around that this week.' },
      { from: 'them', at: '09:42', text: 'Shall we do a 30-min call tomorrow to scope an MVP?' },
    ],
  },
  {
    id: 'aarav', unread: 0, lastAt: 'Tue',
    thread: [
      { from: 'them', at: 'Tue 18:02', text: 'Bro, HackBengaluru — you in? We need one more full-stack.' },
      { from: 'me', at: 'Tue 18:30', text: 'Tempted. Who else is on the team?' },
      { from: 'them', at: 'Tue 18:31', text: 'Dev on infra, Zoya on mobile. You\'d own the web app.' },
    ],
  },
  {
    id: 'isha', unread: 1, lastAt: 'Mon',
    thread: [
      { from: 'me', at: 'Mon 11:00', text: 'Hi Isha — applied for your Q3 mentorship slot. I\'m building an ML product in healthcare.' },
      { from: 'them', at: 'Mon 13:45', text: 'Saw your profile — strong proof of work. Let\'s start with your eval strategy. Send me your current metrics doc.' },
    ],
  },
]

export const ICE_BREAKERS = [
  'Ask Sara about her 30-screen patient-summary concept',
  'You both won a hackathon in 2026 — swap war stories',
  'Propose a 48-hour design-sprint to test the MediGraph MVP',
]

/* ---------- notifications ---------- */
export const NOTIFICATIONS = [
  { id: 1, kind: 'match', icon: 'heart', text: 'New match! You and Sara Khan both swiped right.', time: '2m', unread: true, person: 'sara' },
  { id: 2, kind: 'message', icon: 'chat', text: 'Sara Khan: "Shall we do a 30-min call tomorrow…"', time: '9m', unread: true, person: 'sara' },
  { id: 3, kind: 'invite', icon: 'users', text: 'Aarav Mehta invited you to team AgriSense for SIH.', time: '1h', unread: true, person: 'aarav' },
  { id: 4, kind: 'project', icon: 'folder', text: 'Your application to OpenRAG was shortlisted.', time: '3h', unread: false, person: 'rohan' },
  { id: 5, kind: 'event', icon: 'calendar', text: 'HackBengaluru \'26 is in 10 days — 1,240 builders going.', time: '6h', unread: false, person: null },
  { id: 6, kind: 'community', icon: 'bot', text: '12 new posts in AI Builders since yesterday.', time: '1d', unread: false, person: null },
  { id: 7, kind: 'badge', icon: 'trophy', text: 'Badge unlocked: Hackathon Winner (verified vs Devpost).', time: '2d', unread: false, person: null },
]

/* ---------- connection requests & invitations ---------- */
export const REQUESTS = [
  { id: 'nikhil', note: 'Loved your MediGraph pitch in the Startups community. Ex-founder PM here — open to jamming on healthcare?' },
  { id: 'kabir', note: 'Your launch will need video. I edit for 1M-sub channels. Let\'s talk content engine.' },
]

export const INVITATIONS = [
  { id: 1, kind: 'Team', from: 'aarav', title: 'Join team AgriSense', detail: 'Smart India Hackathon · needs full-stack', icon: 'zap' },
  { id: 2, kind: 'Project', from: 'rohan', title: 'OpenRAG frontend lead', detail: 'Open-source · 8 weeks · shortlisted', icon: 'folder' },
]

/* ---------- analytics ---------- */
export const ANALYTICS = {
  stats: [
    { label: 'Connections', value: 47, delta: '+6 this week' },
    { label: 'Profile views', value: 312, delta: '+18%' },
    { label: 'Acceptance rate', value: '68%', delta: '+4 pts' },
    { label: 'Projects joined', value: 3, delta: '1 active' },
  ],
  weekly: [
    { day: 'Mon', views: 34, matches: 2 },
    { day: 'Tue', views: 41, matches: 3 },
    { day: 'Wed', views: 29, matches: 1 },
    { day: 'Thu', views: 52, matches: 4 },
    { day: 'Fri', views: 61, matches: 3 },
    { day: 'Sat', views: 48, matches: 5 },
    { day: 'Sun', views: 47, matches: 2 },
  ],
  strength: [
    { item: 'Add a 30-second video intro', done: false, boost: '+9%' },
    { item: 'Verify your current company', done: false, boost: '+5%' },
    { item: 'Link GitHub', done: true, boost: null },
    { item: 'Add availability & timezone', done: true, boost: null },
  ],
}

/* ---------- premium ---------- */
export const PREMIUM_PERKS = [
  { icon: 'cards', title: 'Unlimited swipes', text: 'No daily deck cap — discover as deep as you like.' },
  { icon: 'doc', title: 'AI resume review', text: 'Line-by-line feedback tuned to the roles you chase.' },
  { icon: 'eye', title: 'Who viewed you', text: 'See every builder who opened your card this week.' },
  { icon: 'filter', title: 'Advanced search', text: 'Filter by stack, campus, stage, availability and more.' },
  { icon: 'zap', title: 'Priority matching', text: 'Your card surfaces first in compatible decks.' },
  { icon: 'bot', title: 'AI career coach', text: 'A private coach that knows your goals and your graph.' },
  { icon: 'gem', title: 'Premium badge', text: 'A subtle signal that you\'re serious about building.' },
  { icon: 'users', title: 'Exclusive communities', text: 'Founder-only and mentor-led rooms, invite-gated.' },
]

/* ---------- admin ---------- */
export const ADMIN_STATS = [
  { label: 'Total users', value: '12,483', delta: '+312 this week' },
  { label: 'Active communities', value: '9', delta: '2 pending review' },
  { label: 'Live hackathons', value: '4', delta: '1 featured' },
  { label: 'Open reports', value: '7', delta: '3 high priority' },
  { label: 'Premium subs', value: '486', delta: '+38 MoM' },
  { label: 'Events this month', value: '14', delta: '6 online' },
]

export const ADMIN_REPORTS = [
  { id: 'RPT-1042', target: 'user · @growth_guru99', reason: 'MLM recruiting in first messages', severity: 'High', age: '2h', status: 'Open' },
  { id: 'RPT-1041', target: 'user · @vc_connect', reason: 'Romantic advance after match', severity: 'High', age: '5h', status: 'Open' },
  { id: 'RPT-1039', target: 'project · "Passive income bot"', reason: 'Misleading terms — unpaid "equity"', severity: 'Medium', age: '1d', status: 'Reviewing' },
  { id: 'RPT-1036', target: 'community post · Gaming', reason: 'Spam links', severity: 'Low', age: '2d', status: 'Resolved' },
]

export const ADMIN_USERS = [
  { person: 'sara', joined: 'Mar 2026', status: 'Verified', reports: 0 },
  { person: 'aarav', joined: 'Jan 2026', status: 'Verified', reports: 0 },
  { person: 'kabir', joined: 'May 2026', status: 'Pending', reports: 0 },
  { person: 'nikhil', joined: 'Jun 2026', status: 'Verified', reports: 1 },
]

/* ---------- smart search ---------- */
export const SEARCH_SUGGESTIONS = [
  'Python developers',
  'Female founders',
  'Guitarists in Bangalore',
  'Hackathon teammates for SIH',
  'UI designers open to equity',
  'Pianists near me',
]

/* keyword → people mapping the mock "semantic" search uses */
export const SEARCH_INDEX = [
  { match: ['python', 'developer', 'ml', 'ai', 'rag'], ids: ['rohan', 'isha', 'aarav', 'dev'] },
  { match: ['founder', 'startup', 'co-founder', 'female'], ids: ['ananya', 'sara', 'nikhil'] },
  { match: ['guitar', 'music', 'band', 'pianist', 'drummer', 'singer', 'vocalist'], ids: ['meera', 'arjun'] },
  { match: ['hackathon', 'teammate', 'sih', 'team'], ids: ['aarav', 'dev', 'zoya'] },
  { match: ['design', 'ui', 'ux', 'designer'], ids: ['sara', 'tara'] },
  { match: ['creator', 'video', 'editor', 'writer', 'content'], ids: ['kabir', 'tara'] },
]

/* ---------- onboarding purposes ---------- */
export const PURPOSES = [
  { id: 'startup', icon: 'rocket', title: 'Build a startup', text: 'Find co-founders, early hires and mentors.' },
  { id: 'hackathon', icon: 'zap', title: 'Find a hackathon team', text: 'Lock a squad before registration closes.' },
  { id: 'band', icon: 'music', title: 'Join or form a band', text: 'Match with musicians who fit your sound.' },
  { id: 'creative', icon: 'palette', title: 'Collaborate on creative projects', text: 'Editors, writers, artists, animators.' },
  { id: 'network', icon: 'users', title: 'Expand my network', text: 'Meet builders with aligned ambitions.' },
  { id: 'study', icon: 'book', title: 'Find study partners', text: 'Courses, exams and skill sprints, together.' },
  { id: 'explore', icon: 'compass', title: 'Explore communities', text: 'Browse first, commit when it clicks.' },
]

/* ---------- hubs (startup / hackathon / music / creator) ---------- */
export const HUBS = {
  startup: {
    icon: 'rocket', name: 'Startup Hub', kicker: 'Find your founding team',
    title: ['Great companies start as', 'great teams.'],
    sub: 'Tell Brivia what your startup lacks — it recommends people who fill exactly that gap.',
    roles: ['Co-founder', 'Backend', 'Frontend', 'Design', 'Marketing', 'Business', 'AI/ML', 'Interns', 'Investors', 'Mentors'],
    people: ['sara', 'ananya', 'nikhil', 'isha'],
    stats: [['214', 'startups recruiting'], ['38', 'funded this year'], ['92%', 'co-founder match rate']],
  },
  hackathon: {
    icon: 'zap', name: 'Hackathon Hub', kicker: 'Squad up before the clock starts',
    title: ['Teams win hackathons.', 'Find yours.'],
    sub: 'Browse open teams, create your own, or let the AI draft a squad from builders going to your event.',
    roles: ['Full-stack', 'ML', 'Design', 'Pitch', 'Hardware', 'Domain expert'],
    people: ['aarav', 'dev', 'zoya', 'rohan'],
    stats: [['46', 'events on radar'], ['1.2k', 'open team slots'], ['640', 'teams shipped']],
  },
  music: {
    icon: 'music', name: 'Music Hub', kicker: 'Your band is out there',
    title: ['Find the sound', 'you\'re missing.'],
    sub: 'Guitarists, pianists, drummers, singers, producers — matched on genre, schedule and vibe.',
    roles: ['Guitarist', 'Pianist', 'Drummer', 'Singer', 'Bassist', 'Violinist', 'Producer'],
    people: ['meera', 'arjun'],
    stats: [['87', 'bands forming'], ['12', 'jams this month'], ['340', 'gig-ready members']],
  },
  creator: {
    icon: 'palette', name: 'Creator Hub', kicker: 'Make things people share',
    title: ['Every great channel', 'is a duo.'],
    sub: 'Editors, photographers, writers, animators and voice artists — find the other half of your craft.',
    roles: ['Editor', 'Photographer', 'Writer', 'Animator', 'Content creator', 'Voice artist'],
    people: ['kabir', 'tara'],
    stats: [['150+', 'creators onboard'], ['52', 'collabs shipped'], ['9', 'agencies scouting']],
  },
}

/* ---------- AI assistant canned replies ---------- */
export const ASSISTANT_PROMPTS = [
  'I need a backend developer',
  'I need a guitarist',
  'I need a startup idea',
  'I need teammates for SIH',
]

export const ASSISTANT_REPLIES = {
  backend: { text: 'Based on your stack (React + Python) and IST timezone, these backend builders complement you best:', ids: ['dev', 'rohan'], follow: 'Dev is free on weekends like you, and Rohan has RAG depth your MediGraph roadmap needs. Want me to draft an intro message?' },
  guitarist: { text: 'Two gig-ready musicians match your schedule and taste:', ids: ['meera', 'arjun'], follow: 'Meera is actively forming an indie lineup in Kochi and Arjun produces on weekends. Both replied to matches within a day this month.' },
  idea: { text: 'From your profile (healthcare + LLMs + hackathon wins), three directions score highest on founder-fit:', ids: [], follow: '1) Discharge-summary copilot for tier-2 hospitals — pairs with your MediGraph work. 2) Insurance pre-auth automation — painful, unsexy, lucrative. 3) Clinical-trial patient matching — hard moat, needs a domain co-founder (I can suggest three).' },
  teammates: { text: 'For Smart India Hackathon, team AgriSense has 2 open slots and a 92% skill-fit with you:', ids: ['aarav', 'dev', 'zoya'], follow: 'They need exactly your web-app depth. Aarav already sent you an invite — accept it from your dashboard and the team room opens instantly.' },
  default: { text: 'I can find you people, teams, projects or ideas. Try one of the quick prompts below — or describe who you\'re looking for in plain words.', ids: [], follow: null },
}
