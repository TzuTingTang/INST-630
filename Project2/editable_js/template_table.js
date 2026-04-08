
/**
 * TABLE VIEW
 * Display data in sortable rows - good for scanning specific information
 */
function showTable(data) {
  // Requirements:
  // - Show data in a table format
  // - Include all important fields
  // - Make it easy to scan and compare
  // - Consider adding sorting functionality
  //   https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/

    /*
        javascript goes here! you can return it below
    */ 
  
  if (!data || !data.length) {
    return `
      <h2 class="view-title">Table View</h2>
      <p>No restaurant data available.</p>
    `;
  }

  const rows = data
    .slice(0, 100)
    .map((item) => {
      const props = item.properties || {};

      return `
        <tr>
          <td>${props.name || "N/A"}</td>
          <td>${props.city || "N/A"}</td>
          <td>${props.inspection_date ? new Date(props.inspection_date).toLocaleDateString() : "N/A"}</td>
          <td>${props.inspection_results || "N/A"}</td>
          <td>${props.inspection_type || "N/A"}</td>
          <td>${props.address_line_1 || "N/A"}</td>
        </tr>
      `;
    })
    .join("");
  /*html*/ 
  return `
    <h2 class="view-title">Table View</h2>
    <p class="view-description">
      Scan individual restaurant inspection records and compare results quickly.
    </p>

    <div style="overflow-x: auto;">
      <table class="restaurant-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>City</th>
            <th>Inspection Date</th>
            <th>Inspection Result</th>
            <th>Inspection Type</th>
            <th>Address</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

export default showTable;