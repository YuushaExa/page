// /page/src/search.js (Modified slightly to add button)

document.addEventListener('DOMContentLoaded', () => {
  const searchBar = document.getElementById('search-bar');
  const searchResults = document.getElementById('search-results');
  const indexContainer = document.getElementById('index-container'); // Get reference
  const detailsContainer = document.getElementById('details-container'); // Get reference

  if (!searchBar || !searchResults || !indexContainer || !detailsContainer) {
      console.error("Search script error: Required HTML elements not found.");
      return;
  }

  // --- Helper to Show/Hide Index ---
  const showIndexContent = (show) => {
      if (indexContainer) {
          indexContainer.style.display = show ? 'block' : 'none';
      }
  };

  // Debounce function (keep as is)
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // Tokenize function (keep as is)
  const tokenize = (query) => {
    return query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2);
  };

  // Function to fetch and process search results (MODIFIED)
  const handleSearch = async (query) => {
    searchResults.innerHTML = ''; // Clear previous results
    showIndexContent(false); // Hide index initially when search starts

    if (query.length >= 3) {
        searchResults.textContent = 'Searching...'; // Loading indicator
      try {
        const tokens = tokenize(query);
        const tokenResults = await Promise.all(
          tokens.map(async (token) => {
             // Check for global vars
             if (typeof baseUrl === 'undefined' || typeof hobby === 'undefined') {
                 throw new Error("Global variables 'baseUrl' or 'hobby' not defined for search.js.");
             }
             const prefix = token.slice(0, 3);
             const filePath = `${baseUrl}${hobby}/posts/search-index/${prefix}.json`;

             try {
                const response = await fetch(filePath);
                if (!response.ok) {
                    console.warn(`Search index file not found for prefix: ${prefix}.`);
                    return []; // Treat as no results for this token
                }
                const searchData = await response.json();
                const matchedWords = Object.keys(searchData).filter((word) =>
                    word.toLowerCase().startsWith(token)
                );
                return matchedWords.flatMap((word) => searchData[word]);
             } catch (fetchErr) {
                 console.error(`Error fetching index for prefix ${prefix}:`, fetchErr);
                 return []; // Treat as no results on error
             }
          })
        );

        const resultIds = tokenResults.reduce((acc, curr) => {
          if (acc === null) return curr; // First valid set
          if (curr.length === 0 || acc.length === 0) return []; // Empty intersection if any part is empty
          return acc.filter((id) => curr.includes(id));
        }, null); // Start with null

        searchResults.innerHTML = ''; // Clear "Searching..."

        if (resultIds && resultIds.length > 0) {
          // --- Display IDs ---
          resultIds.forEach((id) => {
            const resultItem = document.createElement('div');
            resultItem.textContent = `ID: ${id}`;
            resultItem.setAttribute('data-vn-id', id); // Store ID for easier access later
            searchResults.appendChild(resultItem);
          });
          // --- ADD THE BUTTON ---
          const fetchButton = document.createElement('button');
          fetchButton.id = 'fetch-details-btn'; // ID for the main script to target
          fetchButton.textContent = `Load Details for ${resultIds.length} Result(s)`;
          fetchButton.style.marginTop = '15px';
          searchResults.appendChild(fetchButton);
          // --- Button Added ---
          showIndexContent(false); // Keep index hidden

        } else {
          searchResults.textContent = 'No results found.';
          showIndexContent(true); // Show index if no results
        }
      } catch (error) {
        console.error('Error during search:', error);
        searchResults.textContent = 'Error during search.';
        showIndexContent(true); // Show index on error
      }
    } else if (query.length > 0 && query.length < 3) {
      searchResults.textContent = 'Please type at least 3 characters to search.';
      showIndexContent(true); // Show index if query too short
    } else {
      // Query is empty
      searchResults.innerHTML = ''; // Clear results area
      showIndexContent(true); // Show index when search is cleared
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
      if (detailsContainer.style.display === 'none' && e.target.value.trim() === '') {
          searchResults.innerHTML = '';
          showIndexContent(true);
      }
  });

   // Clear search on hash change if details become visible
   window.addEventListener('hashchange', () => {
       setTimeout(() => {
           if (detailsContainer.style.display !== 'none') {
               searchBar.value = '';
               searchResults.innerHTML = '';
               showIndexContent(true);
           }
       }, 50);
   });

});
