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

    if (query.length >= 1) {
      try {
        // Tokenize the query into individual words
        const tokens = tokenize(query);

        // Fetch search index files for each token and retrieve document IDs
        const tokenResults = await Promise.all(
          tokens.map(async (token) => {
            const prefix = token.slice(0, 2); // Extract the first three letters as the prefix
            const filePath = `${baseUrl}${hobby}/posts/search-index/${prefix}.json`;

            // Fetch the JSON file for the prefix
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`File not found for prefix: ${prefix}`);
            const searchData = await response.json();

            // Find matching words for the token
            const matchedWords = Object.keys(searchData).filter((word) =>
              word.toLowerCase().startsWith(token)
            );

            // Retrieve document IDs for all matching words
            return matchedWords.flatMap((word) => searchData[word]);
          })
        );

        // Find the intersection of document IDs for all tokens
        const resultIds = tokenResults.reduce((acc, curr) => {
          if (acc.length === 0) return curr; // Initialize with the first set of IDs
          return acc.filter((id) => curr.includes(id)); // Keep only IDs present in both sets
        }, []);

        if (resultIds.length > 0) {
          // Display matching IDs
          resultIds.forEach((id) => {
            const resultItem = document.createElement('div');
            resultItem.textContent = `ID: ${id}`;
            searchResults.appendChild(resultItem);
          });
        } else {
          // No results found
          searchResults.textContent = 'No results found.';
        }
      } catch (error) {
        console.error('Error fetching search index:', error);
        searchResults.textContent = 'No results found.';
      }
    } else if (query.length > 0 && query.length < 1) {
      // Inform the user to type at least 3 characters
      searchResults.textContent = 'Please type at least 2 characters to search.';
    } else {
      // Clear results when the input is empty
      searchResults.textContent = '';
    }
  };

  // Add debounced event listener
  searchBar.addEventListener('input', debounce((e) => {
    const query = e.target.value.trim(); // Get the search query
    handleSearch(query);
  }, 300)); // 300ms debounce delay
});
