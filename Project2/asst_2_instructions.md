# Assignment 2: One Dataset, Four Views

A "dataset" is the information you can retrieve dynamically from an open endpoint or database on the internet. If you have access to a database directly, you can form your own sets relatively easily with a SQL query and return them — but if you don't have access, you can still make interesting visualizations. In this assignment, you'll pick an API endpoint, load it, and choose how to visualize the data in four separate "views."

This assignment demonstrates how the same information can tell completely different stories depending on how it's presented — a core principle in information architecture and user experience design.

---

## Learning Objectives

By completing this assignment, you will demonstrate:

- Proficiency with asynchronous data loading using `fetch()` and `async/await`
- Understanding of data transformation techniques using JavaScript array methods
- Ability to create multiple interface patterns for different user goals
- Critical thinking about how presentation shapes meaning and user behavior
- Application of responsive design principles across different layout types

---

## Starter Code

Download the starter code from the Files directory: `asst_2_restaurants.zip`

The starter code provides:

- Four incomplete View templates for you to implement, in the `editable_js/` directory
- Data loading infrastructure
- Event handling setup
- CSS framework with utility classes

To run the code, open the folder in VS Code and run Live Server. You should see it locally.

---

## Technical Requirements

### 1. Data Source
Your data source has been supplied within data.json - it is a large GeoJSON set, which should be appropriate to building either maps or charts.

---

### 2. Implementation Requirements

**Replace the mock data loading function in `load_data.js`:**

```javascript
async function loadData() {
    const response = await fetch(''); // you'll need to edit this line
    const data = await response.json();

    // you'll need to look at the returned data and pick what to pass out of this function
    return data;
}
```

**Complete four view functions:**

1. **Table View** — Data table format
2. **Category View** — Data grouped by meaningful categories
   - Optional goal: sortable columns ([W3C sortable table example](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/))
3. **Statistics View** — Aggregate insights and key metrics
4. **External Library View** - A view that makes use of an external library to visualize the data in a new way

**Each view must:**
- Transform the raw data appropriately for its presentation format
- Include proper error handling for missing data
- Be visually distinct and serve a different user goal
- Work responsively on mobile and desktop screens

---
### 3. Presentation Requirements

**Overall**
- Code works
- Page loads
- Site has a unique visual identity that reinforces the story you're telling about the data
- Responsive mobile-desktop layout
- One "display" font and one "body copy" font
- Updated colors, copy, and a distinct layout based in contemporary CSS.

**Table View:**
- Display data in a clear, scannable table format
- Include 4–6 of the most important columns
- Handle missing data gracefully
- Consider implementing basic sorting functionality

**Category View:**

- Group data by a meaningful field (type, location, price range, etc.)
- Show count and basic statistics for each group
- Use visual hierarchy to distinguish groups from items
- Make it easy to compare categories

**Statistics View:**

- Calculate at least 5 meaningful statistics from your dataset
- Present insights using the provided dashboard layout
- Include comparisons, distributions, or trends
- Use visual hierarchy to highlight key numbers

**External Library View**
- Produce at least one (1) instance of an external library displaying your data

---
**BONUS MARKS**
- Use CSS animations effectively
- Provide load-in indicators and so on
- More than one library correctly integrated
- Really excellent visual design that reinforces data theme.

---

## Submission Requirements

1. **Working webpage link** — Your completed assignment accessible via URL
2. **Code repository** — Link to your code (Netlify or GitHub recommended)
3. **Updated CSS** - Your site for restaurant data needs to be visually distinct