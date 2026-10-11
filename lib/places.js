// Suggests a place ("Gaya, Bihar" / "Delhi") for a video from text YouTube
// already gives us. It only SUGGESTS: the admin sees the result in an
// editable Place field and nothing is saved without being reviewed.
//
// No AI, no network, no quota -- a plain keyword match against Indian states,
// union territories and major cities, in English and Hindi.
//
// Deliberately left out because they are ordinary words in headlines:
//   Hindi "गया" (went), "पुरी" (whole), "सूरत" (face), "कोटा" (quota); Latin "Puri".
// Latin "UP" is case-sensitive so the word "up" never matches.

const STATES = [
  ["Andhra Pradesh", ["Andhra Pradesh", "आंध्र प्रदेश"]],
  ["Arunachal Pradesh", ["Arunachal Pradesh", "अरुणाचल प्रदेश"]],
  ["Assam", ["Assam", "असम"]],
  ["Bihar", ["Bihar", "बिहार"]],
  ["Chhattisgarh", ["Chhattisgarh", "Chattisgarh", "छत्तीसगढ़", "छत्तीसगढ"]],
  ["Goa", ["Goa", "गोवा"]],
  ["Gujarat", ["Gujarat", "गुजरात"]],
  ["Haryana", ["Haryana", "हरियाणा"]],
  ["Himachal Pradesh", ["Himachal Pradesh", "Himachal", "हिमाचल प्रदेश", "हिमाचल"]],
  ["Jharkhand", ["Jharkhand", "झारखंड"]],
  ["Karnataka", ["Karnataka", "कर्नाटक"]],
  ["Kerala", ["Kerala", "केरल"]],
  ["Madhya Pradesh", ["Madhya Pradesh", "मध्य प्रदेश", "मध्यप्रदेश"]],
  ["Maharashtra", ["Maharashtra", "महाराष्ट्र"]],
  ["Manipur", ["Manipur", "मणिपुर"]],
  ["Meghalaya", ["Meghalaya", "मेघालय"]],
  ["Mizoram", ["Mizoram", "मिज़ोरम", "मिजोरम"]],
  ["Nagaland", ["Nagaland", "नागालैंड"]],
  ["Odisha", ["Odisha", "Orissa", "ओडिशा", "उड़ीसा"]],
  ["Punjab", ["Punjab", "पंजाब"]],
  ["Rajasthan", ["Rajasthan", "राजस्थान"]],
  ["Sikkim", ["Sikkim", "सिक्किम"]],
  ["Tamil Nadu", ["Tamil Nadu", "Tamilnadu", "तमिलनाडु", "तमिल नाडु"]],
  ["Telangana", ["Telangana", "तेलंगाना"]],
  ["Tripura", ["Tripura", "त्रिपुरा"]],
  ["Uttar Pradesh", ["Uttar Pradesh", "उत्तर प्रदेश", "उत्तरप्रदेश", "यूपी", { text: "UP", cs: true }]],
  ["Uttarakhand", ["Uttarakhand", "उत्तराखंड"]],
  ["West Bengal", ["West Bengal", "पश्चिम बंगाल"]],
  ["Andaman & Nicobar", ["Andaman", "अंडमान"]],
  ["Chandigarh", ["Chandigarh", "चंडीगढ़", "चंडीगढ"]],
  ["Delhi", ["New Delhi", "Delhi", "नई दिल्ली", "दिल्ली"]],
  ["Jammu & Kashmir", ["Jammu and Kashmir", "Jammu & Kashmir", "Kashmir", "Jammu", "जम्मू कश्मीर", "जम्मू-कश्मीर", "कश्मीर"]],
  ["Ladakh", ["Ladakh", "लद्दाख"]],
  ["Lakshadweep", ["Lakshadweep", "लक्षद्वीप"]],
  ["Puducherry", ["Puducherry", "Pondicherry", "पुडुचेरी"]],
];

// [city label, state label, aliases]
const CITIES = [
  ["Mumbai", "Maharashtra", ["Mumbai", "मुंबई"]],
  ["Pune", "Maharashtra", ["Pune", "पुणे"]],
  ["Nagpur", "Maharashtra", ["Nagpur", "नागपुर"]],
  ["Nashik", "Maharashtra", ["Nashik", "नासिक"]],
  ["Lucknow", "Uttar Pradesh", ["Lucknow", "लखनऊ"]],
  ["Kanpur", "Uttar Pradesh", ["Kanpur", "कानपुर"]],
  ["Varanasi", "Uttar Pradesh", ["Varanasi", "Banaras", "वाराणसी", "बनारस"]],
  ["Prayagraj", "Uttar Pradesh", ["Prayagraj", "Allahabad", "प्रयागराज", "इलाहाबाद"]],
  ["Agra", "Uttar Pradesh", ["Agra", "आगरा"]],
  ["Meerut", "Uttar Pradesh", ["Meerut", "मेरठ"]],
  ["Noida", "Uttar Pradesh", ["Noida", "नोएडा"]],
  ["Ghaziabad", "Uttar Pradesh", ["Ghaziabad", "गाजियाबाद", "गाज़ियाबाद"]],
  ["Gorakhpur", "Uttar Pradesh", ["Gorakhpur", "गोरखपुर"]],
  ["Aligarh", "Uttar Pradesh", ["Aligarh", "अलीगढ़", "अलीगढ"]],
  ["Mathura", "Uttar Pradesh", ["Mathura", "मथुरा"]],
  ["Ayodhya", "Uttar Pradesh", ["Ayodhya", "अयोध्या"]],
  ["Hathras", "Uttar Pradesh", ["Hathras", "हाथरस"]],
  ["Unnao", "Uttar Pradesh", ["Unnao", "उन्नाव"]],
  ["Patna", "Bihar", ["Patna", "पटना"]],
  ["Gaya", "Bihar", ["Gaya"]],
  ["Muzaffarpur", "Bihar", ["Muzaffarpur", "मुजफ्फरपुर", "मुज़फ्फरपुर"]],
  ["Bhagalpur", "Bihar", ["Bhagalpur", "भागलपुर"]],
  ["Darbhanga", "Bihar", ["Darbhanga", "दरभंगा"]],
  ["Ranchi", "Jharkhand", ["Ranchi", "रांची"]],
  ["Dhanbad", "Jharkhand", ["Dhanbad", "धनबाद"]],
  ["Jamshedpur", "Jharkhand", ["Jamshedpur", "जमशेदपुर"]],
  ["Bhopal", "Madhya Pradesh", ["Bhopal", "भोपाल"]],
  ["Indore", "Madhya Pradesh", ["Indore", "इंदौर"]],
  ["Gwalior", "Madhya Pradesh", ["Gwalior", "ग्वालियर"]],
  ["Jabalpur", "Madhya Pradesh", ["Jabalpur", "जबलपुर"]],
  ["Ujjain", "Madhya Pradesh", ["Ujjain", "उज्जैन"]],
  ["Jaipur", "Rajasthan", ["Jaipur", "जयपुर"]],
  ["Jodhpur", "Rajasthan", ["Jodhpur", "जोधपुर"]],
  ["Udaipur", "Rajasthan", ["Udaipur", "उदयपुर"]],
  ["Kota", "Rajasthan", ["Kota"]],
  ["Ajmer", "Rajasthan", ["Ajmer", "अजमेर"]],
  ["Ahmedabad", "Gujarat", ["Ahmedabad", "अहमदाबाद"]],
  ["Surat", "Gujarat", ["Surat"]],
  ["Vadodara", "Gujarat", ["Vadodara", "वडोदरा"]],
  ["Rajkot", "Gujarat", ["Rajkot", "राजकोट"]],
  ["Chennai", "Tamil Nadu", ["Chennai", "चेन्नई"]],
  ["Coimbatore", "Tamil Nadu", ["Coimbatore", "कोयंबटूर"]],
  ["Madurai", "Tamil Nadu", ["Madurai", "मदुरै"]],
  ["Bengaluru", "Karnataka", ["Bengaluru", "Bangalore", "बेंगलुरु", "बेंगलोर", "बैंगलोर"]],
  ["Mysuru", "Karnataka", ["Mysuru", "Mysore"]],
  ["Hyderabad", "Telangana", ["Hyderabad", "हैदराबाद"]],
  ["Kolkata", "West Bengal", ["Kolkata", "Calcutta", "कोलकाता"]],
  ["Bhubaneswar", "Odisha", ["Bhubaneswar", "भुवनेश्वर"]],
  ["Cuttack", "Odisha", ["Cuttack", "कटक"]],
  ["Guwahati", "Assam", ["Guwahati", "गुवाहाटी"]],
  ["Srinagar", "Jammu & Kashmir", ["Srinagar", "श्रीनगर"]],
  ["Dehradun", "Uttarakhand", ["Dehradun", "देहरादून"]],
  ["Haridwar", "Uttarakhand", ["Haridwar", "हरिद्वार"]],
  ["Rishikesh", "Uttarakhand", ["Rishikesh", "ऋषिकेश"]],
  ["Nainital", "Uttarakhand", ["Nainital", "नैनीताल"]],
  ["Shimla", "Himachal Pradesh", ["Shimla", "शिमला"]],
  ["Raipur", "Chhattisgarh", ["Raipur", "रायपुर"]],
  ["Bastar", "Chhattisgarh", ["Bastar", "बस्तर"]],
  ["Amritsar", "Punjab", ["Amritsar", "अमृतसर"]],
  ["Ludhiana", "Punjab", ["Ludhiana", "लुधियाना"]],
  ["Jalandhar", "Punjab", ["Jalandhar", "जालंधर"]],
  ["Gurugram", "Haryana", ["Gurugram", "Gurgaon", "गुरुग्राम", "गुड़गांव"]],
  ["Faridabad", "Haryana", ["Faridabad", "फरीदाबाद"]],
  ["Rohtak", "Haryana", ["Rohtak", "रोहतक"]],
  ["Nuh", "Haryana", ["Nuh", "नूंह"]],
  ["Panipat", "Haryana", ["Panipat", "पानीपत"]],
  ["Kochi", "Kerala", ["Kochi", "Cochin", "कोच्चि"]],
  ["Thiruvananthapuram", "Kerala", ["Thiruvananthapuram", "Trivandrum", "तिरुवनंतपुरम"]],
  ["Visakhapatnam", "Andhra Pradesh", ["Visakhapatnam", "Vizag", "विशाखापत्तनम"]],
  ["Vijayawada", "Andhra Pradesh", ["Vijayawada", "विजयवाड़ा"]],
  ["Imphal", "Manipur", ["Imphal", "इम्फाल", "इंफाल"]],
  ["Shillong", "Meghalaya", ["Shillong", "शिलांग"]],
];

// Unicode-aware "whole word": \b only understands ASCII, which would make
// Devanagari matches fire inside longer words.
const L = "(?<![\\p{L}\\p{M}\\p{N}])";
const R = "(?![\\p{L}\\p{M}\\p{N}])";
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function compile(alias) {
  const { text, cs } = typeof alias === "string" ? { text: alias, cs: false } : alias;
  return new RegExp(L + esc(text).replace(/\s+/g, "\\s+") + R, cs ? "u" : "iu");
}

const ENTRIES = [
  ...CITIES.map(([city, state, aliases]) => ({ label: `${city}, ${state}`, kind: "city", res: aliases.map(compile) })),
  ...STATES.map(([state, aliases]) => ({ label: state, kind: "state", res: aliases.map(compile) })),
];

// Earliest mention wins; a city beats a state mentioned at the same spot.
function findIn(text) {
  if (!text) return "";
  let best = null;
  for (const entry of ENTRIES) {
    for (const re of entry.res) {
      const m = re.exec(text);
      if (!m) continue;
      const better =
        !best ||
        m.index < best.index ||
        (m.index === best.index && entry.kind === "city" && best.kind !== "city");
      if (better) best = { index: m.index, label: entry.label, kind: entry.kind };
    }
  }
  return best ? best.label : "";
}

// Order of trust: creator-set recording location, then the title, then the
// opening of the description (usually about the story; later text is mostly
// links and channel promotion, so it is not searched).
export function suggestPlace({ title, description, locationDescription } = {}) {
  const loc = (locationDescription || "").trim();
  if (loc) {
    const fromLoc = findIn(loc);
    if (fromLoc) return fromLoc;
    if (loc.length <= 100) return loc;
  }
  return findIn(title || "") || findIn((description || "").slice(0, 300));
}
