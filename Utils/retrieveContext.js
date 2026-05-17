const Site = require('../Models/Site');
const Activity = require('../Models/Activity');
const Exhibit = require('../Models/Exhibit');
const TimelineEvent = require('../Models/TimelineEvent');
const VisitorInfo = require('../Models/VisitorInfo');
const Gallery = require('../Models/Gallery');
const Category = require('../Models/Category');
const Review = require('../Models/Review');

// ─── Keyword expander for heritage queries ────────────────────────────────────
const SYNONYMS = {
  history:    ['history', 'historical', 'past', 'ancient', 'heritage', 'traditional', 'story', 'origin'],
  royal:      ['royal', 'king', 'queen', 'palace', 'mwami', 'ubwami', 'throne', 'kingdom'],
  genocide:   ['genocide', 'memorial', 'kizito', 'murambi', 'gisozi', 'tutsi', '1994', 'remembrance'],
  nature:     ['nature', 'natural', 'forest', 'park', 'mountain', 'volcano', 'lake', 'wildlife', 'nyungwe', 'akagera', 'virunga'],
  culture:    ['culture', 'cultural', 'intore', 'dance', 'ceremony', 'tradition', 'craft', 'art', 'living'],
  colonial:   ['colonial', 'german', 'belgian', 'missionary', 'kandt', 'rusumo'],
  visit:      ['visit', 'tour', 'explore', 'see', 'go', 'travel', 'trip'],
  kigali:     ['kigali', 'city', 'capital', 'urban'],
  southern:   ['southern', 'south', 'butare', 'huye', 'nyanza', 'gikongoro'],
  northern:   ['northern', 'north', 'musanze', 'ruhengeri', 'volcanoes'],
  eastern:    ['eastern', 'east', 'akagera', 'kayonza'],
  western:    ['western', 'west', 'kibuye', 'rubavu', 'gisenyi', 'kivu'],
};

const STOP_WORDS = new Set([
  'tell', 'me', 'about', 'what', 'are', 'the', 'is', 'a', 'an', 'and', 'or',
  'for', 'in', 'of', 'to', 'how', 'can', 'you', 'i', 'give', 'show', 'list',
  'some', 'any', 'all', 'with', 'from', 'that', 'this', 'there', 'do', 'does',
  'have', 'has', 'get', 'find', 'know', 'want', 'need', 'please', 'hi', 'hello',
  'should', 'which', 'would', 'like', 'best', 'good', 'great', 'nice',
]);

// ─── Expand keywords from query ───────────────────────────────────────────────
const expandKeywords = (query) => {
  const lower = query.toLowerCase();
  const rawWords = lower
    .split(/[\s,?!.]+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const expanded = new Set(rawWords);

  for (const [, synonymList] of Object.entries(SYNONYMS)) {
    const matched = synonymList.some((s) => lower.includes(s));
    if (matched) synonymList.forEach((s) => expanded.add(s));
  }

  return [...expanded].slice(0, 12);
};

// ─── Detect what the user is asking about ────────────────────────────────────
const detectIntent = (query) => {
  const lower = query.toLowerCase();
  const intents = [];

  if (/activit|do|tour|experience|program/.test(lower)) intents.push('activities');
  if (/exhibit|artifact|collection|display|object|item/.test(lower)) intents.push('exhibits');
  if (/histor|when|built|year|timeline|event|happened/.test(lower)) intents.push('timeline');
  if (/how to get|direction|parking|transport|bus|accessibility|open|hour|fee|cost|price|contact|phone|website|social/.test(lower)) intents.push('visitorInfo');
  if (/photo|video|image|gallery|look|picture/.test(lower)) intents.push('gallery');
  if (/review|opinion|rating|people say|visitors say/.test(lower)) intents.push('reviews');
  if (/categor|type|kind/.test(lower)) intents.push('categories');

  return intents.length ? intents : ['general'];
};

// ─── Build MongoDB regex query ────────────────────────────────────────────────
const buildRegexQuery = (fields, keywords) => {
  if (!keywords.length) return {};
  return {
    $or: keywords.flatMap((word) =>
      fields.map((field) => ({ [field]: { $regex: word, $options: 'i' } }))
    ),
  };
};

// ─── MAIN RETRIEVER ───────────────────────────────────────────────────────────
const retrieveContext = async (query, siteId = null, language = 'en') => {
  try {
    if (!query) return '';

    const keywords = expandKeywords(query);
    const intents = detectIntent(query);

    console.log('🔍 RAG Query:', query);
    console.log('🧩 Keywords:', keywords);
    console.log('🎯 Intents:', intents);

    const contextParts = [];

    // ── If scoped to a specific site, fetch everything for that site ──────────
    if (siteId) {
      const [site, activities, exhibits, timeline, visitorInfo, reviews] =
        await Promise.all([
          Site.findById(siteId).populate('category', 'name').lean(),
          Activity.find({ site: siteId }).sort('order').lean(),
          Exhibit.find({ site: siteId }).sort('order').lean(),
          TimelineEvent.find({ site: siteId }).sort({ year: 1 }).lean(),
          VisitorInfo.findOne({ site: siteId }).lean(),
          Review.find({ site: siteId }).sort('-createdAt').limit(5).lean(),
        ]);

      if (site) {
        const L = language;
        const fallback = (field) => field?.[L] || field?.en || '';

        // Core site info
        contextParts.push(`
SITE: ${fallback(site.name)}
Category: ${site.category?.name || ''}
Province: ${site.province}, District: ${site.district || ''}
Historical Period: ${site.historicalPeriod || ''}
Description: ${fallback(site.shortDescription)}
Full Story: ${fallback(site.fullStory)}
Significance: ${fallback(site.significance)}
Opening Hours: ${site.openingHours || 'Not specified'}
Admission: ${site.admissionFee || 'Free'}
Rating: ${site.averageRating}/5 from ${site.totalReviews} reviews
Total Visits: ${site.totalVisits}
`);

        // Activities
        if (activities.length > 0) {
          const actList = activities
            .map((a) => `  • ${fallback(a.name)}${a.duration ? ` (${a.duration})` : ''} — ${fallback(a.description)} [${a.included ? 'Included' : 'Extra cost'}]`)
            .join('\n');
          contextParts.push(`ACTIVITIES:\n${actList}`);
        }

        // Exhibits
        if (exhibits.length > 0) {
          const exList = exhibits
            .map((e) => `  • ${fallback(e.name)}${e.yearCreated ? ` (${e.yearCreated})` : ''} — ${fallback(e.description)}`)
            .join('\n');
          contextParts.push(`EXHIBITS & ARTIFACTS:\n${exList}`);
        }

        // Timeline
        if (timeline.length > 0) {
          const tlList = timeline
            .map((t) => `  • ${t.year}: ${fallback(t.title)} — ${fallback(t.description)}${t.isKeyEvent ? ' ⭐' : ''}`)
            .join('\n');
          contextParts.push(`HISTORICAL TIMELINE:\n${tlList}`);
        }

        // Visitor Info
        if (visitorInfo) {
          contextParts.push(`
VISITOR INFORMATION:
Getting There: ${fallback(visitorInfo.gettingThere)}
Parking: ${visitorInfo.parking ? 'Available' : 'Not available'}
Wheelchair Accessible: ${visitorInfo.wheelchairAccessible ? 'Yes' : 'No'}
Best Time to Visit: ${fallback(visitorInfo.bestTimeToVisit)}
Average Visit Duration: ${visitorInfo.averageVisitDuration || 'Not specified'}
Guided Tours: ${visitorInfo.guidedTours ? `Yes — ${visitorInfo.guidedTourSchedule || ''}` : 'No'}
Guided Tour Fee: ${visitorInfo.guidedTourFee || 'Free'}
Available Languages: ${visitorInfo.availableLanguages?.join(', ') || 'English'}
Photography: ${visitorInfo.photographyAllowed ? 'Allowed' : 'Not allowed'}
Photography Rules: ${fallback(visitorInfo.photographyRules)}
Dress Code: ${fallback(visitorInfo.dresscode)}
Tips: ${fallback(visitorInfo.tips)}
Nearby Accommodation: ${fallback(visitorInfo.nearbyAccommodation)}
Nearby Restaurants: ${fallback(visitorInfo.nearbyRestaurants)}
Nearby Attractions: ${fallback(visitorInfo.nearbyAttractions)}
Phone: ${visitorInfo.phone || 'Not available'}
Email: ${visitorInfo.email || 'Not available'}
Website: ${visitorInfo.officialWebsite || 'Not available'}
Facebook: ${visitorInfo.socialMedia?.facebook || ''}
Instagram: ${visitorInfo.socialMedia?.instagram || ''}
`);
        }

        // Recent reviews
        if (reviews.length > 0) {
          const rvList = reviews
            .map((r) => `  ★${r.rating}/5: "${r.comment}" ${r.isVerifiedVisit ? '[Verified Visit]' : ''}`)
            .join('\n');
          contextParts.push(`RECENT VISITOR REVIEWS:\n${rvList}`);
        }
      }

      return contextParts.join('\n\n---\n\n');
    }

    // ── General search — no specific site ────────────────────────────────────
    const siteQuery = buildRegexQuery(
      ['name.en', 'name.rw', 'name.fr', 'shortDescription.en', 'shortDescription.rw',
        'fullStory.en', 'province', 'district', 'historicalPeriod'],
      keywords
    );

    const [sites, categories] = await Promise.all([
      Site.find({ ...siteQuery, isPublished: true })
        .populate('category', 'name color')
        .limit(5)
        .lean(),
      intents.includes('categories')
        ? Category.find({}).lean()
        : [],
    ]);

    if (sites.length > 0) {
      const L = language;
      const fallback = (field) => field?.[L] || field?.en || '';

      const siteList = sites.map((s) => `
• ${fallback(s.name)} (${s.category?.name || ''}, ${s.province})
  ${fallback(s.shortDescription)}
  Rating: ${s.averageRating}/5 | Visits: ${s.totalVisits}
  Admission: ${s.admissionFee || 'Free'} | Hours: ${s.openingHours || 'Check site'}
`).join('\n');

      contextParts.push(`RELEVANT HERITAGE SITES:\n${siteList}`);
    }

    if (categories.length > 0) {
      const catList = categories
        .map((c) => `  • ${c.name}`)
        .join('\n');
      contextParts.push(`HERITAGE CATEGORIES:\n${catList}`);
    }

    const result = contextParts.join('\n\n---\n\n');
    console.log(`📦 RAG retrieved ${contextParts.length} context sections`);
    return result;

  } catch (error) {
    console.error('❌ RAG Retrieval Error:', error.message);
    return '';
  }
};

module.exports = retrieveContext;