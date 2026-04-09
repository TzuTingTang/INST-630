
/**
 * EXTERNAL LIBRARY VIEW
 * Pick an external library and pipe your data to it.
 */
function showTable(data) {
  // Requirements:
  // - Show data using an external library, such as leaflet.js or chartsjs or similar.
  // - Make a filter on this page so your external library only shows useful data.

    /*
        javascript goes here! you can return it below
    */ 
   setTimeout(() => {
    const mapElement = document.getElementById("map");
    if (!mapElement) return;

    if (typeof L === "undefined") {
      mapElement.innerHTML = "<p>Leaflet failed to load.</p>";
      return;
    }

    
    if (mapElement._leaflet_id) {
      mapElement._leaflet_id = null;
    }

    const map = L.map("map").setView([38.9, -76.85], 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    data.forEach((item) => {
      const coords = item.geometry?.coordinates;
      const props = item.properties || {};

      if (coords && coords.length === 2) {
        const lng = coords[0];
        const lat = coords[1];

        if (lat != null && lng != null) {
          L.marker([lat, lng])
            .addTo(map)
            .bindPopup(`
              <strong>${props.name || "N/A"}</strong><br>
              ${props.city || "N/A"}<br>
              ${props.inspection_results || "N/A"}
            `);
        }
      }
    });
  }, 0);
        /*html*/ 
  return `
    <h2 class="view-title">Library View</h2>
    <p class="view-description">
      An interactive Leaflet map showing restaurant inspection locations.
    </p>
    <div id="map" style="height: 500px; border-radius: 12px;"></div>
  `;
}

export default showTable;