/**
 * AutoCar India Tracker - Dual-Source Data Engine
 * ================================================
 * SOURCE A: YouTube Data API v3     → video list, thumbnails, dates
 * SOURCE B: YouTube Transcript API  → full spoken transcript text
 * LLM LAYER: Claude / OpenAI       → intelligent spec extraction from transcript
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const FormData = require('form-data');
require('dotenv').config();
const { YoutubeTranscript, YoutubeTranscriptDisabledError, YoutubeTranscriptNotAvailableError } = require('./node_modules/youtube-transcript');

// ─── Config ─────────────────────────────────────────────────────────────────
const YOUTUBE_API_KEY  = process.env.YOUTUBE_API_KEY;
const GROQ_API_KEY     = process.env.GROQ_API_KEY;         // Groq Llama 3 key
const GEMINI_API_KEY   = process.env.GEMINI_API_KEY;       // Google Gemini key
const CHANNEL_ID       = process.env.YOUTUBE_CHANNEL_ID || 'UCxPCOQ5h3y5tTq_q56Zg8jQ';
const OUTPUT_FILE      = path.join(__dirname, '..', 'public', 'data', 'cars.json');
const DAYS_BACK        = 60;

// ─── Brand / Segment lookup tables ──────────────────────────────────────────
const BRANDS = [
  'Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Kia', 'Toyota', 'Honda',
  'Skoda', 'Volkswagen', 'MG', 'Renault', 'Nissan', 'Jeep', 'Citroen',
  'Mercedes-Benz', 'BMW', 'Audi', 'Volvo', 'Land Rover', 'Porsche', 'BYD',
  'Lexus', 'Lamborghini', 'Ferrari', 'Rolls-Royce', 'Bentley', 'Force'
];

// ─── STEP 1: Resolve the real Channel ID ────────────────────────────────────
async function resolveChannelId() {
  try {
    const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'id', forUsername: 'autocarindia1', key: YOUTUBE_API_KEY }
    });
    if (res.data.items?.length > 0) return res.data.items[0].id;
  } catch (e) {
    console.warn('⚠️  Could not resolve channel by username, using default ID.');
  }
  return CHANNEL_ID;
}

// ─── STEP 2: Fetch video list from YouTube Search API ───────────────────────
async function fetchVideoList(channelId) {
  const publishedAfter = new Date();
  publishedAfter.setDate(publishedAfter.getDate() - DAYS_BACK);

  const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
    params: {
      part: 'snippet',
      channelId,
      maxResults: 50,
      order: 'date',
      publishedAfter: publishedAfter.toISOString(),
      type: 'video',
      key: YOUTUBE_API_KEY
    }
  });

  return (res.data.items || []).filter(item => {
    const t = item.snippet.title.toLowerCase();
    return t.includes('review') || t.includes('first drive') || t.includes('walkaround') || t.includes('drive');
  });
}

// ─── STEP 3A: Fetch full video details (description) ─────────────────────────
async function fetchVideoDetails(videoIds) {
  const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
    params: {
      part: 'snippet',
      id: videoIds.join(','),
      key: YOUTUBE_API_KEY
    }
  });
  const map = {};
  for (const item of (res.data.items || [])) {
    map[item.id] = item.snippet.description;
  }
  return map;
}

// ─── STEP 3B: Fetch YouTube Transcript (youtube-transcript package) ──────────
/**
 * Uses the youtube-transcript library which directly queries YouTube's
 * inner API (timedtext) to get the official caption track — far more
 * reliable than scraping HTML.
 */
async function fetchTranscript(videoId) {
  try {
    let segments = null;

    // Try English first, then fallback to any available language
    try {
      segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
    } catch {
      try {
        segments = await YoutubeTranscript.fetchTranscript(videoId);
      } catch (inner) {
        return null; // Both failed
      }
    }

    if (!segments || segments.length === 0) return null;

    // Decode HTML entities and concatenate all segments
    const plainText = segments
      .map(s => s.text
        .replace(/&#39;/g, "'").replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>'))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return plainText.length > 50 ? plainText : null;
  } catch (err) {
    // Transcript disabled or not available — graceful fallback to description
    return null;
  }
}

// ─── STEP 3C: Fetch Audio Transcript (yt-dlp + Groq Whisper) ─────────────────
async function fetchAudioTranscript(videoId) {
  if (!GROQ_API_KEY) return null;
  const audioFile = path.join(__dirname, `temp_${videoId}.m4a`);

  try {
    // Download audio quietly
    execSync(`.\\yt-dlp.exe -f "bestaudio[ext=m4a]" --output "${audioFile}" https://www.youtube.com/watch?v=${videoId}`, { stdio: 'ignore' });
    
    const form = new FormData();
    form.append('file', fs.createReadStream(audioFile));
    form.append('model', 'whisper-large-v3-turbo');
    form.append('response_format', 'json');
    form.append('language', 'en');

    const res = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${GROQ_API_KEY}`
      }
    });

    return res.data.text;
  } catch (err) {
    console.error(`\n    ❌ Audio Error: ${err.response?.data?.error?.message || err.message}`);
    return null;
  } finally {
    if (fs.existsSync(audioFile)) {
      try { fs.unlinkSync(audioFile); } catch(e) {}
    }
  }
}

// ─── STEP 4: LLM Extraction (Groq primary, Gemini fallback) ─────────────────
async function extractSpecsWithLLM(title, description, transcript) {
  if (!GROQ_API_KEY && (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE')) return null;

  const sourceText = transcript
    ? `VIDEO DESCRIPTION:\n${description}\n\nFULL TRANSCRIPT:\n${transcript.substring(0, 8000)}`
    : `VIDEO DESCRIPTION:\n${description}`;

  const prompt = `You are an expert automotive journalist. Analyze the following content from a car review video and extract structured specifications. Pay very close attention to any mention of torque, boot space, ground clearance, and airbags.

Content:
---
Title: ${title}
${sourceText}
---

Return a valid JSON object with ONLY these fields (use null if not mentioned, but search diligently before falling back to null):
{
  "price": "<price in Indian Rupees e.g. \u20b912.5 lakh or null if not mentioned>",
  "segment": "<one of: SUV, Compact SUV, Luxury SUV, Sedan, Hatchback, EV, Hybrid, MUV, Convertible>",
  "power": "<e.g. 150 bhp or null>",
  "torque": "<e.g. 320 Nm or null>",
  "engine": "<e.g. 1.5L Turbo Petrol or null>",
  "transmission": "<e.g. 6-speed Manual / 7-speed DCT or null>",
  "efficiency": "<e.g. 18.5 kmpl or 400 km range (EV) or null>",
  "groundClearance": "<e.g. 190 mm or null>",
  "bootSpace": "<e.g. 430 L or null>",
  "airbags": 6,
  "hasADAS": true,
  "features": ["list", "of", "notable", "features"],
  "verdict": "<one sentence reviewer verdict or null>"
}

Return ONLY the JSON object, no extra text or markdown fences.`;

  // 1. Try Groq Llama 3 first
  if (GROQ_API_KEY) {
    try {
      const res = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.1
        },
        { headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
      );
      
      const text = res.data.choices[0].message.content.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn(`  ⚠️  Groq extraction failed, falling back to Gemini: ${e.response?.data?.error?.message || e.message}`);
    }
  }

  // 2. Fallback to Gemini 2.5 Flash
  if (GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const rawText = res.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!rawText) return null;

      // Strip any accidental markdown fences
      const jsonStr = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      console.warn(`  ⚠️  Gemini fallback failed: ${e.response?.data?.error?.message || e.message}`);
    }
  }
  
  return null;
}

// ─── STEP 5: Heuristic fallback (no LLM) ─────────────────────────────────────
function extractSpecsHeuristic(title, description) {
  const fullText = `${title} ${description}`;

  // Segment
  let segment = 'SUV';
  const segMap = [
    [/\belectric\b|\bEV\b/i, 'EV'], [/\bhatchback\b/i, 'Hatchback'],
    [/\bsedan\b/i, 'Sedan'], [/\bMUV\b|\bMPV\b|\bminivan\b/i, 'MUV'],
    [/\bSUV\b/i, 'SUV'], [/\bcoupe\b/i, 'Coupe']
  ];
  for (const [re, seg] of segMap) { if (re.test(fullText)) { segment = seg; break; } }

  // Price
  const priceMatch = fullText.match(/(?:Rs\.?|₹)\s*([\d.-]+)\s*(lakh|crore|L)/i) ||
                     fullText.match(/([\d.-]+)\s*(lakh|crore|L)\s*(?:onwards|ex-showroom)/i);

  return {
    price: priceMatch ? `₹${priceMatch[1]} ${priceMatch[2]?.toLowerCase() === 'l' ? 'lakh' : priceMatch[2]?.toLowerCase()}` : null,
    segment,
    power: description.match(/([\d.]+)\s*bhp/i)?.[0] || description.match(/([\d.]+)\s*PS/i)?.[0] || null,
    torque: description.match(/([\d.]+)\s*Nm/i)?.[0] || null,
    engine: null,
    transmission: null,
    efficiency: description.match(/([\d.]+)\s*kmpl/i)?.[0] ||
                description.match(/([\d.]+)\s*km range/i)?.[0] || null,
    groundClearance: description.match(/([\d.]+)\s*mm ground clearance/i)?.[0] || null,
    bootSpace: description.match(/([\d.]+)\s*litres? boot/i)?.[0] || null,
    airbags: null,
    hasADAS: /adas/i.test(fullText),
    features: [],
    verdict: null
  };
}

// ─── STEP 6: Extract Brand / Model from title ─────────────────────────────────
function extractBrandModel(title) {
  let brand = 'Unknown';
  let model = title;

  for (const b of BRANDS) {
    if (new RegExp(`\\b${b}\\b`, 'i').test(title)) {
      brand = b;
      model = title
        .replace(new RegExp(b, 'i'), '')
        .split(/review|first drive|walkaround|walkathrough|\|/i)[0]
        .trim()
        .replace(/^[-–\s]+/, '');
      break;
    }
  }

  return { brand, model: model || title };
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function fetchAndProcess() {
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_API_KEY_HERE') {
    console.error('❌  YOUTUBE_API_KEY not set in .env');
    return;
  }

  let llmStatus = '⚠️  Not configured (heuristics only)';
  if (GROQ_API_KEY) llmStatus = '✅  Groq Llama 3 (Primary)' + (GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE' ? ' / Gemini (Fallback)' : '');
  else if (GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') llmStatus = '✅  Gemini 2.5 Flash';
  const hasLLM = llmStatus.includes('✅');

  console.log(`\n🚗  AutoCar India Tracker — Dual-Source Data Engine`);
  console.log(`📡  YouTube API: ✅  |  LLM: ${llmStatus}`);
  console.log(`---------------------------------------------------`);

  // 1. Resolve channel
  const channelId = await resolveChannelId();
  console.log(`📺  Channel ID: ${channelId}`);

  // 2. Fetch video list
  const videos = await fetchVideoList(channelId);
  console.log(`🎬  Found ${videos.length} review videos in last ${DAYS_BACK} days`);

  if (videos.length === 0) {
    console.log('No videos found. Exiting.');
    return;
  }

  // 3. Fetch full descriptions for all videos (batch)
  const videoIds = videos.map(v => v.id.videoId);
  const descriptions = await fetchVideoDetails(videoIds);

  // 4. Process each video
  const results = [];
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const videoId = video.id.videoId;
    const title = video.snippet.title;
    const description = descriptions[videoId] || video.snippet.description || '';

    process.stdout.write(`\n[${i + 1}/${videos.length}] ${title.substring(0, 55)}...\n`);

    // Fetch transcript
    process.stdout.write(`  📝 Fetching transcript... `);
    let transcript = await fetchTranscript(videoId);
    let hasTranscript = !!transcript;
    
    if (hasTranscript) {
      console.log(`✅ (${transcript.split(' ').length} words)`);
    } else {
      console.log('⚠️  Not available via API');
      if (GROQ_API_KEY) {
        process.stdout.write(`  🎧 Extracting audio & transcribing with AI... `);
        transcript = await fetchAudioTranscript(videoId);
        hasTranscript = !!transcript;
        console.log(hasTranscript ? `✅ (${transcript.split(' ').length} words)` : '⚠️  Audio extraction failed');
      }
    }

    if (!hasTranscript) {
      console.log('⏭️  Skipping car since no transcript/audio could be extracted.');
      continue;
    }

    // Extract specs
    let specs = null;
    let confidence_score = 0.5;

    if (hasLLM) {
      process.stdout.write(`  🤖 LLM extraction... `);
      specs = await extractSpecsWithLLM(title, description, transcript);
      if (specs) {
        confidence_score = hasTranscript ? 1.0 : 0.5;
        console.log(`✅  (confidence: ${confidence_score})`);
      } else {
        console.log('⚠️  Falling back to heuristics');
      }
    }

    if (!specs) {
      specs = extractSpecsHeuristic(title, description);
      confidence_score = hasTranscript ? 0.6 : 0.3;
      if (!hasLLM) console.log(`  📋 Using heuristics (confidence: ${confidence_score})`);
    }

    const { brand, model } = extractBrandModel(title);

    results.push({
      id: videoId,
      title,
      videoId,
      publishedAt: video.snippet.publishedAt,
      thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
      brand,
      model,
      segment: specs.segment || 'SUV',
      price: specs.price || 'TBC',
      confidence_score,
      source: hasTranscript ? 'transcript+description' : 'description_only',
      specs: {
        engine:          specs.engine || null,
        power:           specs.power || '~150 bhp',
        torque:          specs.torque || null,
        transmission:    specs.transmission || null,
        efficiency:      specs.efficiency || (specs.segment === 'EV' ? '~400 km range' : '~15 kmpl'),
        groundClearance: specs.groundClearance || null,
        bootSpace:       specs.bootSpace || null,
        airbags:         specs.airbags || null,
        hasADAS:         specs.hasADAS || false,
        features:        specs.features || [],
        verdict:         specs.verdict || null
      }
    });

    // Polite delay to avoid YouTube rate-limiting
    if (i < videos.length - 1) await new Promise(r => setTimeout(r, 800));
  }

  // 5. Save to JSON
  if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));

  const withTranscript = results.filter(r => r.source === 'transcript+description').length;
  const withLLM = results.filter(r => r.confidence_score >= 0.5).length;

  console.log(`\n✅  Done! Saved ${results.length} cars to cars.json`);
  console.log(`   📊 Transcript available: ${withTranscript}/${results.length}`);
  console.log(`   🤖 LLM-extracted specs:  ${hasLLM ? withLLM : 0}/${results.length}`);
  console.log(`   📋 Average confidence:   ${(results.reduce((s, r) => s + r.confidence_score, 0) / results.length).toFixed(2)}`);
}

fetchAndProcess().catch(err => console.error('Fatal error:', err));
