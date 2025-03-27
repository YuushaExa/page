// /page/src/search.js (Modified)

// Add event listener for the search bar
document.addEventListener('DOMContentLoaded', () => {
  const searchBar = document.getElementById('search-bar');
  const searchResults = document.getElementById('search-results');
  const indexContainer = document.getElementById('index-container'); // Get reference to index container

  // Ensure indexContainer exists
  if (!indexContainer) {
      console.error("Element with ID 'index-container' not found.");
      return; // Stop if essential element is missing
  }

  // Debounce function (keep as is)
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // Function to tokenize the query (keep as is)
  const tokenize = (query) => {
    return query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2);
  };

  // --- Function to control visibility of index ---
  const showIndexContent = (show) => {
      if (indexContainer) {
          indexContainer.style.display = show ? 'block' : 'none';
      }
  }

  // Function to fetch and process search results (MODIFIED)
  const handleSearch = async (query) => {
    searchResults.innerHTML = ''; // Clear previous results first

    if (query.length >= 3) {
        // --- Hide index content while searching ---
        showIndexContent(false);
        searchResults.textContent = 'Searching...'; // Indicate activity

      try {
        const tokens = tokenize(query);
        const tokenResults = await Promise.all(
          tokens.map(async (token) => {
            const prefix = token.slice(0, 3);
            const filePath = `${baseUrl}${hobby}/posts/search-index/${prefix}.json`; // Assumes baseUrl and hobby are global

            // Check if baseUrl and hobby are defined
             if (typeof baseUrl === 'undefined' || typeof hobby === 'undefined') {
                 throw new Error("Global variables 'baseUrl' or 'hobby' not defined.");
             }

            const response = await fetch(filePath);
            if (!response.ok) {
                 // Don't throw error for missing index file, just return empty results for this token
                 console.warn(`Search index file not found for prefix: ${prefix}`);
                 return [];
            }
            const searchData = await response.json();
            const matchedWords = Object.keys(searchData).filter((word) =>
              word.toLowerCase().startsWith(token)
            );
            return matchedWords.flatMap((word) => searchData[word]);
          })
        );

        const resultIds = tokenResults.reduce((acc, curr) => {
          // If any token returned no results, the intersection is empty
          if (!curr || curr.length === 0) return [];
          // Initialize accumulator or compute intersection
          return acc === null ? curr : acc.filter((id) => curr.includes(id));
        }, null); // Use null to distinguish initial state

        searchResults.innerHTML = ''; // Clear "Searching..." message

        if (resultIds && resultIds.length > 0) {
            // --- Results found: Keep index hidden ---
            showIndexContent(false);
            resultIds.forEach((id) => {
                const resultItem = document.createElement('div');
                // --- IMPORTANT: Make these links to the actual VN detail pages ---
                const detailLink = document.createElement('a');
                const vnPath = `${hobby}/posts/${id}.json`; // Assuming ID is filename base
                detailLink.href = `#/${vnPath}`; // Use hash routing
                detailLink.textContent = `View VN: ${id}`; // TODO: Fetch title for better display?
                resultItem.appendChild(detailLink);
                // --- End link creation ---
                searchResults.appendChild(resultItem);
            });
        } else {
          // --- No results found: Show index again ---
          searchResults.textContent = 'No results found.';
          showIndexContent(true);
        }
      } catch (error) {
        console.error('Error performing search:', error);
        searchResults.textContent = 'Error during search.';
        // --- Show index on error ---
        showIndexContent(true);
      }
    } else if (query.length > 0 && query.length < 3) {
      searchResults.textContent = 'Please type at least 3 characters to search.';
      // --- Show index if query is too short ---
      showIndexContent(true);
    } else {
      // Clear results and show index when the input is empty
      searchResults.textContent = '';
      showIndexContent(true);
    }
  };

  // Add debounced event listener
  searchBar.addEventListener('input', debounce((e) => {
    // Only run search if we are not on a detail page
    if (detailsContainer.style.display === 'none') {
        const query = e.target.value.trim();
        handleSearch(query);
    }
  }, 300));

  // Also ensure index is shown if search bar is cleared manually quickly
  searchBar.addEventListener('input', (e) => {
      if (e.target.value.trim() === '') {
          searchResults.innerHTML = '';
          showIndexContent(true);
      }
  });

});
