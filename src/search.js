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
 const handleSearch = async (query) => {
  searchResults.innerHTML = ''; // Clear previous results

  if (query.length >= 2) {
    try {
      // Tokenize the query into individual words
      const tokens = tokenize(query);

      // Fetch search index files for each token and retrieve document IDs
      const tokenResults = await Promise.all(
        tokens.map(async (token) => {
          const prefix = token.slice(0, 2); // First two letters as prefix
          const filePath = `${baseUrl}${hobby}/posts/search-index/${prefix}.json`;

          const response = await fetch(filePath);
          if (!response.ok) throw new Error(`File not found for prefix: ${prefix}`);
          const searchData = await response.json();

          // Find exact matches for the token (or closest match)
          const exactMatch = searchData[token] || 
                            Object.entries(searchData)
                              .find(([word]) => word.includes(token))?.[1];

          return exactMatch || [];
        })
      );

      // Find the intersection of document IDs for all tokens
      const resultIds = tokenResults.reduce((acc, curr) => {
        if (acc.length === 0) return curr;
        return acc.filter(id => curr.includes(id));
      }, []);

      // Display results
      if (resultIds.length > 0) {
        searchResults.innerHTML = resultIds.map(id => 
          `<div class="search-result">ID: ${id}</div>`
        ).join('');
      } else {
        searchResults.textContent = 'No results found.';
      }
    } catch (error) {
      console.error('Error fetching search index:', error);
      searchResults.innerHTML = `
        <div class="search-error">
          Error loading search results. Please try again.
        </div>
      `;
    }
  } else if (query.length > 0) {
    searchResults.textContent = 'Please type at least 2 characters to search.';
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
