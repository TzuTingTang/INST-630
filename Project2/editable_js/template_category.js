/**
 * CATEGORY VIEW - STUDENTS IMPLEMENT
 * Group data by categories - good for understanding relationships and patterns
 */
function showCategories(data) {
  // Requirements:
  // - Group data by a meaningful category (cuisine, neighborhood, price, etc.)
  // - Show items within each group
  // - Make relationships between groups clear
  // - Consider showing group statistics

  /* JavaScript Goes Here */ 
  if (!data || !data.length) {
    return `<p>No data available.</p>`;
  }

  const groupedByCity = data.reduce((acc, item) => {
    const city = item.properties?.city || "Unknown";
    if (!acc[city]) {
      acc[city] = [];
    }
    acc[city].push(item);
    return acc;
  }, {});

  const sections = Object.entries(groupedByCity)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10)
    .map(([city, restaurants]) => {
      const criticalCount = restaurants.filter((item) =>
        (item.properties?.inspection_results || "").includes("Critical")
      ).length;

      const sampleItems = restaurants
        .slice(0, 5)
        .map((item) => {
          const props = item.properties || {};
          return `
            <div class="category-item">
              <strong>${props.name || "N/A"}</strong><br>
              <span>${props.inspection_results || "N/A"}</span>
            </div>
          `;
        })
        .join("");

      

  /* html */
  return `
        <section class="category-section">
          <h3 class="category-header">${city}</h3>
          <div class="category-items">
            <p><strong>Total restaurants:</strong> ${restaurants.length}</p>
            <p><strong>Critical results:</strong> ${criticalCount}</p>
            ${sampleItems}
          </div>
        </section>
      `;
    })
    .join("");

  return `
    <h2 class="view-title">Category View</h2>
    <p class="view-description">
      Restaurants grouped by city to show local inspection patterns and relationships.
    </p>
    ${sections}
  `;
}


export default showCategories;