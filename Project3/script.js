let data = [];
let synth;
let stopTimer = null;

async function loadData() {
  const res = await fetch("./whr2024_clean.json");
  data = await res.json();

  const select = document.getElementById("countrySelect");
  data.slice(0, 20).forEach(d => {
    const option = document.createElement("option");
    option.value = d.country;
    option.textContent = d.country;
    select.appendChild(option);
  });
}

function getSelectedCountry() {
  const name = document.getElementById("countrySelect").value;
  return data.find(d => d.country === name);
}

function mapToSound(d) {
  const isMajor = d.ladder > 6;
  const tempo = 60 + d.gdp_norm * 80;

  const scale = isMajor
    ? ["C4", "E4", "G4", "A4"]
    : ["A3", "C4", "D4", "E4"];

  return { scale, tempo };
}

function stopSound() {
  Tone.Transport.stop();
  Tone.Transport.cancel();
  Tone.Transport.position = 0;

  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
}

async function playSound() {
  const country = getSelectedCountry();
  const output = document.getElementById("output");

  await Tone.start();

  if (!synth) {
    synth = new Tone.Synth().toDestination();
  }

  const { scale, tempo } = mapToSound(country);

 
  stopSound();

  Tone.Transport.bpm.value = tempo;

  scale.forEach((note, i) => {
    Tone.Transport.schedule((time) => {
      synth.triggerAttackRelease(note, "8n", time);
    }, i * 0.5);
  });

  Tone.Transport.start();

 
  stopTimer = setTimeout(() => {
    stopSound();
  }, scale.length * 500 + 200);

  output.textContent = JSON.stringify(country, null, 2);
}

document.getElementById("playBtn").addEventListener("click", playSound);

loadData();