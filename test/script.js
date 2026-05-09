let data = [];
let geoLayer = null;
let selectedLayer = null;
let radarChart = null;
let pgRadarChart = null;
let leafletMap = null;

// audio nodes — kept global so we can reuse them across plays
let polySynth = null;
let reverb = null;
let filterNode = null;
let tremoloNode = null;
let pannerNode = null;
let volNode = null;
let sequence = null;
let audioReady = false;

// the geojson we're using has different country names than WHR,
// so we need to map them manually. found these mismatches by clicking around.
const GEO_TO_WHR = {
  "USA": "United States",
  "England": "United Kingdom",
  "United Republic of Tanzania": "Tanzania",
  "Czech Republic": "Czechia",
  "Turkey": "Turkiye",
  "Taiwan": "Taiwan Province of China",
  "Hong Kong": "Hong Kong S.A.R. of China",
  "Republic of Congo": "Congo (Brazzaville)",
  "Republic of Serbia": "Serbia",
  "Democratic Republic of the Congo": "Congo (Kinshasa)",
  "Palestine": "State of Palestine",
  "Macedonia": "North Macedonia",
  "Swaziland": "Eswatini",
  "eSwatini": "Eswatini",
  "South Korea": "South Korea",
  "North Korea": null,  // not in WHR dataset
  "Ivory Coast": "Ivory Coast",
  "Russia": "Russia",
  "Syria": null,
};

function whrNameFromGeo(geoName) {
  if (geoName in GEO_TO_WHR) return GEO_TO_WHR[geoName];
  return geoName;
}

// what each dimension controls in the audio
const DIMS = [
  { key: "ladder_norm",     label: "Happiness",  maps: "Chord Voicing",   color: "#B84B28" },
  { key: "gdp_norm",        label: "GDP",         maps: "Tempo (BPM)",     color: "#6B8C5E" },
  { key: "health_norm",     label: "Health",      maps: "Octave Register", color: "#5A7FA8" },
  { key: "freedom_norm",    label: "Freedom",     maps: "Stereo Panning",  color: "#8C6E9A" },
  { key: "generosity_norm", label: "Generosity",  maps: "Rhythm Density",  color: "#4A7A7A" },
  { key: "corruption_norm", label: "Integrity",   maps: "Tremolo",         color: "#A87840" },
];

// some countries have null for certain fields, fall back to midpoint
const safe = (v, fallback = 0.5) => (v != null ? v : fallback);

async function loadData() {
  const res = await fetch("./whr2024_clean.json");
  data = await res.json();

  const select = document.getElementById("countrySelect");
  data.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.country;
    opt.textContent = d.country;
    select.appendChild(opt);
  });

  initMap();
  initRadarChart();

  if (data.length > 0) {
    document.getElementById("countrySelect").value = data[0].country;
    renderBars(data[0]);
  }
}

// color scale: terracotta (unhappy) → sage green (happy)
// using a two-segment linear interpolation through a warm sand midpoint
function happinessColor(norm) {
  if (norm == null) return "#D8D0C0";
  let r, g, b;
  if (norm <= 0.5) {
    const t = norm * 2;
    r = Math.round(184 + (210 - 184) * t);
    g = Math.round(75 + (178 - 75) * t);
    b = Math.round(40 + (100 - 40) * t);
  } else {
    const t = (norm - 0.5) * 2;
    r = Math.round(210 + (74 - 210) * t);
    g = Math.round(178 + (122 - 178) * t);
    b = Math.round(100 + (89 - 100) * t);
  }
  return `rgb(${r},${g},${b})`;
}

function countryByName(name) {
  return data.find(d => d.country === name) || null;
}

function initMap() {
  leafletMap = L.map("map", { zoomControl: true, scrollWheelZoom: true })
    .setView([20, 0], 2);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
    attribution: "© OpenStreetMap contributors © CARTO",
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(leafletMap);

  fetch("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
    .then(r => r.json())
    .then(geo => buildChoropleth(geo));
}

function buildChoropleth(geo) {
  geoLayer = L.geoJSON(geo, {
    style: feature => {
      const whrName = whrNameFromGeo(feature.properties.name);
      const d = whrName ? countryByName(whrName) : null;
      return {
        fillColor: d ? happinessColor(d.ladder_norm) : "#E0D8CC",
        fillOpacity: d ? 0.85 : 0.4,
        color: "#F0EBE0",
        weight: 0.8,
      };
    },
    onEachFeature: (feature, layer) => {
      const whrName = whrNameFromGeo(feature.properties.name);
      const d = whrName ? countryByName(whrName) : null;
      if (!d) return;

      layer.on({
        mouseover: e => {
          if (e.target !== selectedLayer) e.target.setStyle({ fillOpacity: 1 });
          e.target.bindTooltip(
            `<strong>${d.country}</strong><br>Happiness: ${d.ladder.toFixed(2)}`,
            { sticky: true, className: "map-tooltip" }
          ).openTooltip();
        },
        mouseout: e => {
          if (e.target !== selectedLayer) geoLayer.resetStyle(e.target);
        },
        click: () => selectCountry(d.country),
      });
    },
  }).addTo(leafletMap);
}

function highlightOnMap(countryName) {
  if (!geoLayer) return;
  if (selectedLayer) geoLayer.resetStyle(selectedLayer);
  selectedLayer = null;

  geoLayer.eachLayer(layer => {
    if (!layer.feature) return;
    const whrName = whrNameFromGeo(layer.feature.properties.name);
    if (whrName === countryName) {
      layer.setStyle({ fillOpacity: 1 });
      selectedLayer = layer;
    }
  });
}

function selectCountry(name) {
  const d = countryByName(name);
  if (!d) return;
  document.getElementById("countrySelect").value = name;
  highlightOnMap(name);
  renderBars(d);
  updateRadarChart(d);
  playSoundForCountry(d);
}

function initRadarChart() {
  const ctx = document.getElementById("radarChart").getContext("2d");
  radarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["Happiness", "GDP", "Health", "Freedom", "Generosity", "Integrity"],
      datasets: [{
        label: "",
        data: [0, 0, 0, 0, 0, 0],
        backgroundColor: "rgba(184,75,40,0.08)",
        borderColor: "#B84B28",
        borderWidth: 1.5,
        pointBackgroundColor: "#B84B28",
        pointRadius: 3,
        pointHoverRadius: 5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          min: 0, max: 1,
          ticks: {
            display: true,
            stepSize: 0.25,
            color: "rgba(28,24,20,0.25)",
            backdropColor: "transparent",
            font: { family: "'Space Mono', monospace", size: 9 },
            callback: v => v === 0 ? "" : `${Math.round(v * 100)}`,
          },
          grid: { color: "rgba(28,24,20,0.08)" },
          angleLines: { color: "rgba(28,24,20,0.08)" },
          pointLabels: {
            color: "#7A7066",
            font: { family: "'Space Grotesk', sans-serif", size: 11 },
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#F0EBE0",
          titleColor: "#1C1814",
          bodyColor: "#7A7066",
          borderColor: "#C9C0B0",
          borderWidth: 1,
          callbacks: {
            label: ctx => ` ${(ctx.raw * 100).toFixed(1)}%`,
          },
        },
      },
      animation: { duration: 500 },
    },
  });
}

// color the radar to match the choropleth — same interpolation function
function radarColor(norm) {
  const n = safe(norm, 0);
  let r, g, b;
  if (n <= 0.5) {
    const t = n * 2;
    r = Math.round(184 + (210 - 184) * t);
    g = Math.round(75 + (178 - 75) * t);
    b = Math.round(40 + (100 - 40) * t);
  } else {
    const t = (n - 0.5) * 2;
    r = Math.round(210 + (74 - 210) * t);
    g = Math.round(178 + (122 - 178) * t);
    b = Math.round(100 + (89 - 100) * t);
  }
  return { r, g, b, css: `rgb(${r},${g},${b})` };
}

function updateRadarChart(d) {
  const { r, g, b, css } = radarColor(d.ladder_norm);
  radarChart.data.datasets[0].label = d.country || "Custom";
  radarChart.data.datasets[0].data = [
    safe(d.ladder_norm, 0),
    safe(d.gdp_norm, 0),
    safe(d.health_norm, 0),
    safe(d.freedom_norm, 0),
    safe(d.generosity_norm, 0),
    safe(d.corruption_norm, 0),
  ];
  radarChart.data.datasets[0].borderColor = css;
  radarChart.data.datasets[0].pointBackgroundColor = css;
  radarChart.data.datasets[0].backgroundColor = `rgba(${r},${g},${b},0.12)`;
  radarChart.update();

  const hint = document.getElementById("radarHint");
  if (hint) hint.style.display = "none";
}

function getScaleLabel(n) {
  if (n > 0.75) return "Open fifth (bright)";
  if (n > 0.5) return "Major";
  if (n > 0.25) return "Minor";
  return "Diminished (dark)";
}

function barDetail(cfg, d) {
  const v = safe(d[cfg.key]);
  if (cfg.key === "ladder_norm") return getScaleLabel(v);
  if (cfg.key === "gdp_norm") return `BPM ${Math.round(60 + v * 78)}`;
  if (cfg.key === "health_norm") return v > 0.67 ? "+1 octave (bright)" : v < 0.33 ? "−1 octave (dark)" : "Mid register";
  if (cfg.key === "freedom_norm") return `Pan rate ${(0.3 + v * 2.0).toFixed(1)} Hz`;
  if (cfg.key === "generosity_norm") return `${Math.max(2, Math.round(2 + v * 6))}/8 beats active`;
  if (cfg.key === "corruption_norm") {
    const wet = v < 0.5 ? (1 - v * 2) * 0.9 : 0;
    const rate = (3 + (1 - v) * 9).toFixed(1);
    return wet > 0.5 ? `Tremolo ${rate} Hz (unstable)` : wet > 0.1 ? `Tremolo ${rate} Hz` : "Steady (clean)";
  }
  return `${Math.round(v * 100)}%`;
}

function renderBars(d) {
  const container = document.getElementById("bars");
  container.innerHTML = "";
  DIMS.forEach(cfg => {
    const val = d ? safe(d[cfg.key]) : 0;
    const pct = Math.round(val * 100);
    const detail = d ? barDetail(cfg, d) : "—";
    container.innerHTML += `
      <div class="bar-row">
        <div class="bar-label">
          <span class="dim-name">${cfg.label}</span>
          <span class="dim-maps">→ ${cfg.maps}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%;background:${cfg.color}"></div>
        </div>
        <div class="bar-detail">${detail}</div>
      </div>`;
  });
}

async function initAudio() {
  if (audioReady) return;

  reverb = new Tone.Reverb({ decay: 3, preDelay: 0.01 });
  await reverb.ready;

  filterNode = new Tone.Filter(3000, "lowpass");

  // tremolo for integrity — tried distortion first but it made chords sound bad
  tremoloNode = new Tone.Tremolo({ frequency: 8, depth: 0.8, wet: 0 }).start();

  // autopanner for freedom — reverb depth was too subtle to notice
  pannerNode = new Tone.AutoPanner({ frequency: 1, wet: 0 }).start();

  // -14dB because 3-note chords stack up quickly
  volNode = new Tone.Volume(-14);

  polySynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.08, decay: 0.2, sustain: 0.55, release: 1.4 },
  });

  polySynth.chain(filterNode, tremoloNode, pannerNode, reverb, volNode, Tone.getDestination());
  audioReady = true;
}

function buildChord(rootNote, intervals) {
  const freq = Tone.Frequency(rootNote);
  return intervals.map(i => freq.transpose(i).toNote());
}

function buildSoundParams(d) {
  const ladderN     = safe(d.ladder_norm);
  const gdpN        = safe(d.gdp_norm);
  const healthN     = safe(d.health_norm);
  const freedomN    = safe(d.freedom_norm);
  const generosityN = safe(d.generosity_norm);
  const corruptionN = safe(d.corruption_norm);

  // happiness controls which chord type we use
  let baseNotes, chordIntervals;
  if (ladderN > 0.75) {
    baseNotes = ["C5","E5","G5","B5","D5","G5","E5","C5"];
    chordIntervals = [0, 7, 12]; // open fifth — bright and open
  } else if (ladderN > 0.5) {
    baseNotes = ["C4","E4","G4","A4","G4","E4","D4","C4"];
    chordIntervals = [0, 4, 7]; // major
  } else if (ladderN > 0.25) {
    baseNotes = ["A3","C4","D4","E4","G4","E4","D4","A3"];
    chordIntervals = [0, 3, 7]; // minor
  } else {
    baseNotes = ["A3","Bb3","D4","E4","F4","E4","D4","Bb3"];
    chordIntervals = [0, 3, 6]; // diminished
  }

  // slip in a tritone at position 2 if integrity is really low
  const notes = [...baseNotes];
  if (corruptionN < 0.35) {
    notes[2] = Tone.Frequency(baseNotes[0]).transpose(6).toNote();
  }

  // health shifts the whole thing up or down an octave
  const octaveShift = healthN > 0.67 ? 12 : healthN < 0.33 ? -12 : 0;

  const melodyChords = notes.map(note => {
    const shifted = Tone.Frequency(note).transpose(octaveShift).toNote();
    return buildChord(shifted, chordIntervals);
  });

  // generosity = how many of the 8 slots get a note (min 2 so it's never silent)
  const numActive = Math.max(2, Math.round(2 + generosityN * 6));
  const fillOrder = [0, 4, 2, 6, 1, 3, 5, 7]; // downbeats first
  const pattern = new Array(8).fill(null);
  for (let i = 0; i < numActive; i++) {
    pattern[fillOrder[i]] = melodyChords[fillOrder[i]];
  }

  const pannerRate = 0.3 + freedomN * 2.0;
  const pannerWet = freedomN * 0.85;

  // tremolo cuts off cleanly above 0.5 integrity
  const tremoloWet = corruptionN < 0.5 ? (1 - corruptionN * 2) * 0.9 : 0;
  const tremoloRate = 3 + (1 - corruptionN) * 9;

  return {
    pattern,
    bpm: Math.round(60 + gdpN * 78),
    noteDur: "4n",
    velocity: 0.55,
    reverbWet: 0.15 + freedomN * 0.30,
    filterFreq: 600 + ladderN * 3400,
    pannerRate,
    pannerWet,
    tremoloWet,
    tremoloRate,
  };
}

function stopSound() {
  if (sequence) { sequence.stop(); sequence.dispose(); sequence = null; }
  Tone.Transport.stop();
  Tone.Transport.cancel();
  setStatus("idle");
}

async function playSoundForCountry(d, label) {
  await Tone.start();
  await initAudio();
  stopSound();

  const p = buildSoundParams(d);

  Tone.Transport.bpm.value = p.bpm;
  reverb.wet.value = p.reverbWet;
  filterNode.frequency.value = p.filterFreq;
  tremoloNode.frequency.value = p.tremoloRate;
  tremoloNode.wet.value = p.tremoloWet;
  pannerNode.frequency.value = p.pannerRate;
  pannerNode.wet.value = p.pannerWet;

  // null slots in the pattern are rests — Tone.Sequence skips them
  sequence = new Tone.Sequence(
    (time, chord) => {
      if (chord) polySynth.triggerAttackRelease(chord, p.noteDur, time, p.velocity);
    },
    p.pattern,
    "8n"
  );
  sequence.loop = true;
  sequence.start(0);
  Tone.Transport.start();
  setStatus("playing", label || d.country || "Custom");
}

function setStatus(state, name) {
  ["status", "pgStatus"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = state === "playing" ? `♪ ${name}` : "";
    el.className = "status" + (state === "playing" ? " playing" : "");
  });
}

// map view controls
document.getElementById("playBtn").addEventListener("click", () => {
  let name = document.getElementById("countrySelect").value;
  if (!name && data.length > 0) {
    name = data[0].country;
    document.getElementById("countrySelect").value = name;
  }
  const d = countryByName(name);
  if (!d) return;
  highlightOnMap(name);
  renderBars(d);
  updateRadarChart(d);
  playSoundForCountry(d);
});

document.getElementById("stopBtn").addEventListener("click", stopSound);

document.getElementById("countrySelect").addEventListener("change", e => {
  selectCountry(e.target.value);
});

document.querySelectorAll(".view-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.view;
    document.querySelectorAll(".view-tab").forEach(t => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    document.querySelectorAll(".view").forEach(v => { v.hidden = true; });
    document.getElementById("view-" + target).hidden = false;
    stopSound();
    pgPlaying = false;
    if (target === "playground") {
      // warm up the audio context on the tab click so play works immediately
      Tone.start().then(() => initAudio()).catch(() => {});
    }
    if (target === "map" && radarChart) {
      // chart.js needs a resize call after being hidden
      radarChart.resize();
    }
  });
});

// playground radar — separate instance from the map view one
function initPgRadarChart() {
  const ctx = document.getElementById("pgRadarChart").getContext("2d");
  pgRadarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["Happiness", "GDP", "Health", "Freedom", "Generosity", "Integrity"],
      datasets: [{
        label: "Profile",
        data: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
        backgroundColor: "rgba(184,75,40,0.08)",
        borderColor: "#B84B28",
        borderWidth: 1.5,
        pointBackgroundColor: "#B84B28",
        pointRadius: 3,
        pointHoverRadius: 5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          min: 0, max: 1,
          ticks: {
            display: true,
            stepSize: 0.25,
            color: "rgba(28,24,20,0.25)",
            backdropColor: "transparent",
            font: { family: "'Space Mono', monospace", size: 9 },
            callback: v => v === 0 ? "" : `${Math.round(v * 100)}`,
          },
          grid: { color: "rgba(28,24,20,0.08)" },
          angleLines: { color: "rgba(28,24,20,0.08)" },
          pointLabels: {
            color: "#7A7066",
            font: { family: "'Space Grotesk', sans-serif", size: 11 },
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#F0EBE0",
          titleColor: "#1C1814",
          bodyColor: "#7A7066",
          borderColor: "#C9C0B0",
          borderWidth: 1,
          callbacks: { label: c => ` ${(c.raw * 100).toFixed(1)}%` },
        },
      },
      animation: { duration: 200 },
    },
  });
}

function updatePgRadarChart(vals) {
  const { r, g, b, css } = radarColor(vals.ladder_norm);
  pgRadarChart.data.datasets[0].data = [
    safe(vals.ladder_norm, 0),
    safe(vals.gdp_norm, 0),
    safe(vals.health_norm, 0),
    safe(vals.freedom_norm, 0),
    safe(vals.generosity_norm, 0),
    safe(vals.corruption_norm, 0),
  ];
  pgRadarChart.data.datasets[0].borderColor = css;
  pgRadarChart.data.datasets[0].pointBackgroundColor = css;
  pgRadarChart.data.datasets[0].backgroundColor = `rgba(${r},${g},${b},0.12)`;
  pgRadarChart.update();
}

const PG_SLIDERS = [
  { id: "sl-ladder",     key: "ladder_norm",     valId: "sv-ladder"     },
  { id: "sl-gdp",        key: "gdp_norm",        valId: "sv-gdp"        },
  { id: "sl-health",     key: "health_norm",     valId: "sv-health"     },
  { id: "sl-freedom",    key: "freedom_norm",    valId: "sv-freedom"    },
  { id: "sl-generosity", key: "generosity_norm", valId: "sv-generosity" },
  { id: "sl-corruption", key: "corruption_norm", valId: "sv-corruption" },
];

let pgDebounce = null;
let pgPlaying = false;

function getSliderValues() {
  const vals = {};
  PG_SLIDERS.forEach(s => {
    vals[s.key] = parseFloat(document.getElementById(s.id).value);
  });
  return vals;
}

function findClosestCountry(vals) {
  let minDist = Infinity, closest = null;
  data.forEach(d => {
    let dist = 0;
    PG_SLIDERS.forEach(s => {
      const diff = vals[s.key] - safe(d[s.key], 0.5);
      dist += diff * diff;
    });
    if (dist < minDist) { minDist = dist; closest = d; }
  });
  return closest;
}

function updateSliderFill(el) {
  const pct = ((parseFloat(el.value) - parseFloat(el.min)) /
               (parseFloat(el.max) - parseFloat(el.min))) * 100;
  el.style.setProperty("--fill", pct + "%");
}

function updatePlayground() {
  const vals = getSliderValues();

  PG_SLIDERS.forEach(s => {
    const slider = document.getElementById(s.id);
    document.getElementById(s.valId).textContent = parseFloat(slider.value).toFixed(2);
    updateSliderFill(slider);
  });

  if (pgRadarChart) updatePgRadarChart(vals);

  const match = findClosestCountry(vals);
  if (!match) return;

  const fmt = v => (v != null ? Number(v).toFixed(3) : "—");
  document.getElementById("pgCountryName").textContent = match.country;
  document.getElementById("pg-ladder").textContent     = fmt(match.ladder);
  document.getElementById("pg-gdp").textContent        = fmt(match.gdp);
  document.getElementById("pg-health").textContent     = fmt(match.health);
  document.getElementById("pg-freedom").textContent    = fmt(match.freedom);
  document.getElementById("pg-generosity").textContent = fmt(match.generosity);
  document.getElementById("pg-corruption").textContent = fmt(match.corruption);

  if (pgPlaying) {
    clearTimeout(pgDebounce);
    pgDebounce = setTimeout(() => {
      playSoundForCountry(getSliderValues(), "Custom Profile");
    }, 300);
  }
}

function initPlayground() {
  initPgRadarChart();

  PG_SLIDERS.forEach(s => {
    const slider = document.getElementById(s.id);
    updateSliderFill(slider);
    slider.addEventListener("input", updatePlayground);
  });

  document.getElementById("pgPlayBtn").addEventListener("click", async () => {
    pgPlaying = true;
    const vals = getSliderValues();
    updatePgRadarChart(vals);
    try {
      await Tone.start();
      await playSoundForCountry(vals, "Custom Profile");
    } catch (err) {
      console.error("playground play failed:", err);
    }
  });

  document.getElementById("pgStopBtn").addEventListener("click", () => {
    pgPlaying = false;
    stopSound();
  });

  // run once to populate the match card before user interacts
  updatePlayground();
}

loadData().then(() => initPlayground());
