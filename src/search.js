// Add event listener for the search bar
document.addEventListener('DOMContentLoaded', () => {
  const searchBar = document.getElementById('search-bar');
  const searchResults = document.getElementById('search-results');

  // Debounce function to limit the frequency of search requests
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // Function to tokenize the query into individual words
  const tokenize = (query) => {
    return query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter((word) => word.length > 1); // Ignore short words
  };

  // Function to fetch and process search results
// Update your handleSearch function with this version
const handleSearch = async (query) => {
  searchResults.innerHTML = ''; // Clear previous results

  if (query.length >= 2) {
    try {
      const prefix = query.slice(0, 2).toLowerCase(); // Get first two characters
      const filePath = `${baseUrl}${hobby}/posts/search-index/${prefix}.json`;
      
      const response = await fetch(filePath);
      if (!response.ok) throw new Error(`Index not found for prefix: ${prefix}`);
      
      const searchData = await response.json();
      
      // Find all word groups that start with the search query
      const results = [];
      
      // Get the main category (like "av" or "mi")
      const mainCategory = searchData[prefix];
      if (mainCategory) {
        // Search through all word groups in this category
        for (const [word, ids] of Object.entries(mainCategory)) {
          if (word.toLowerCase().includes(query.toLowerCase())) {
            results.push(...ids);
          }
        }
      }
      
      // Display results
      if (results.length > 0) {
        // Remove duplicates and display
        const uniqueResults = [...new Set(results)];
        searchResults.innerHTML = uniqueResults.map(id => 
          `<div class="search-result">${id}</div>`
        ).join('');
      } else {
        searchResults.textContent = 'No results found.';
      }
    } catch (error) {
      console.error('Search error:', error);
      searchResults.textContent = 'Error loading search results.';
    }
  } else if (query.length > 0) {
    searchResults.textContent = 'Please type at least 2 characters.';
  } else {
    searchResults.textContent = '';
  }
};

  // Add debounced event listener
  searchBar.addEventListener('input', debounce((e) => {
    const query = e.target.value.trim(); // Get the search query
    handleSearch(query);
  }, 300)); // 300ms debounce delay
});
