// ============================================
// DATA LOADING
// ============================================

async function loadData() {
  try {
    // Load your data here by passing a string to the Fetch request.
    // It should be in data.json in the root folder, but you'll need to look at the results to see what's there.

    const response = await fetch ("./data.json")  // go get some data
    const data = await response.json();
    console.log("data loaded", data);
    
    // You'll need to look at that data in the console to make sure you have restaurants to work with
    return data.features || [];
  } catch (error) {
    console.error("Failed to load data:", error);
    throw new Error("Could not load data from API");
  }
}

export default loadData