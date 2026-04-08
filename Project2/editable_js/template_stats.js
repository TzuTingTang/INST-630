/**
 * STATS VIEW
 * Show aggregate statistics and insights - good for understanding the big picture
 */
function showStats(data) {
  // Requirements:
  // Replace the below "task" description with the following:
  // - One meaningful statistic calculation from the supplied dataset
  // ===- percent of restaurants not passing hand-washing, for example
  // - Present insights visually
  // - Show distributions, averages, counts, etc.
  // - Help users understand patterns in the data
  
  /* Javascript calculations here */   
  if (!data || !data.length) {
    return `<p>No data available.</p>`;
  }

  const total = data.length;

  const uniqueCities = new Set(
    data.map((item) => item.properties?.city).filter(Boolean)
  ).size;

  const criticalCount = data.filter((item) =>
    (item.properties?.inspection_results || "").includes("Critical")
  ).length;

  const nonCompliantCount = data.filter((item) =>
    (item.properties?.inspection_results || "").includes("Non-Compliant")
  ).length;

  const reopenedCount = data.filter((item) =>
    (item.properties?.inspection_results || "").includes("Reopened")
  ).length;

  const handWashingOutCount = data.filter(
    (item) => item.properties?.adequate_hand_washing === "Out of Compliance"
  ).length;
  
  /* html return */
  return `
    <h2 class="view-title">Stats View</h2>
    <p class="view-description">
      A high-level dashboard showing major inspection patterns across the dataset.
    </p>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">${total}</div>
        <div class="stat-label">Total Records</div>
      </div>

      <div class="stat-card">
        <div class="stat-number">${uniqueCities}</div>
        <div class="stat-label">Cities Covered</div>
      </div>

      <div class="stat-card">
        <div class="stat-number">${criticalCount}</div>
        <div class="stat-label">Critical Violations Observed</div>
      </div>

      <div class="stat-card">
        <div class="stat-number">${nonCompliantCount}</div>
        <div class="stat-label">Non-Compliant Results</div>
      </div>

      <div class="stat-card">
        <div class="stat-number">${reopenedCount}</div>
        <div class="stat-label">Facilities Reopened</div>
      </div>

      <div class="stat-card">
        <div class="stat-number">${handWashingOutCount}</div>
        <div class="stat-label">Hand-Washing Out of Compliance</div>
      </div>
    </div>
  `;
}

export default showStats