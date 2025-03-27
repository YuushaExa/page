// /page/src/search.js (Updated)

document.addEventListener('DOMContentLoaded', () => {
  // --- UI Elements ---
  const searchBar = document.getElementById('search-bar');
  const searchResults = document.getElementById('search-results');
  const indexContainer = document.getElementById('index-container'); // For hiding/showing main list
  const detailsContainer = document.getElementById('details-container'); // To check if details are shown

  // --- Basic Check ---
  if (!searchBar || !searchResults || !indexContainer || !detailsContainer) {
    console.error('Search script error: Required HTML elements not found.');
    return;
  }

  // --- Debounce Function ---
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // --- Tokenize Function ---
  const tokenize = (query) => {
    return query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2);
  };

  // --- Helper to Show/Hide Index ---
  const showIndexContent = (show) => {
    if (indexContainer) {
      indexContainer.style.display = show ? 'block' : 'none';
    }
  };

  // --- Function to Fetch Details for Multiple IDs ---
  const fetchVNDetails = async (ids) => {
    // Limit the number of fetches to avoid overwhelming the browser/network
    const limitedIds = ids.slice(0, 20); // Show max 20 results
    console.log(`Fetching details for ${limitedIds.length} IDs...`);

    const detailPromises = limitedIds.map(id => {
      // Construct the path assuming ID is the filename base (e.g., v123)
      const vnPath = `${hobby}/posts/${id}.json`; // Assumes 'hobby' is global
      const detailUrl = `${baseUrl}${vnPath}`;   // Assumes 'baseUrl' is global

      // Check for global vars needed
      if (typeof baseUrl === 'undefined' || typeof hobby === 'undefined') {
           console.error("Global variables 'baseUrl' or 'hobby' not available to search.js");
           // Return a rejected promise or null to indicate failure for this ID
           return Promise.reject(new Error('Missing global config'));
      }

      return fetch(detailUrl)
        .then(response => {
          if (!response.ok) {
            // Don't fail all, just mark this one as failed
            console.warn(`Failed to fetch details for ID ${id} (${response.status})`);
            return null; // Indicate failure for this specific ID
          }
          return response.json();
        })
        .then(data => data ? { ...data, id: id, link: vnPath } : null) // Add id and link for rendering, keep null if fetch failed
        .catch(error => {
          console.error(`Error fetching/parsing details for ID ${id}:`, error);
          return null; // Indicate failure on other errors
        });
    });

    // Use Promise.all to wait for all fetches (even if some fail with null)
    const results = await Promise.all(detailPromises);
    // Filter out null results (failed fetches)
    return results.filter(data => data !== null);
  };


  // --- Function to Render Search Results as Cards ---
  const renderSearchResults = (vnDetailsList) => {
      searchResults.innerHTML = vnDetailsList.map(post => `
        <div class="vn-container"> {/* Use same class as index items */}
          <div class="vn-title">
            {/* Use the 'link' property we added */}
            <a href="#/${post.link}">${post.title || `VN ${post.id}`}</a>
          </div>
          <div class="vn-description">${post.description || 'No description.'}</div>
          ${post.image?.url ? `<img class="vn-image" src="${post.image.url}" alt="${post.title || `VN ${post.id}`}">` : ''}
        </div>
      `).join('');
  };

  // --- Main Search Handler ---
  const handleSearch = async (query) => {
    // Clear previous results and hide index immediately
    searchResults.innerHTML = '';
    showIndexContent(false); // Hide index content when search starts

    if (query.length >= 3) {
      searchResults.textContent = 'Searching...'; // Loading indicator

      try {
        // --- Step 1: Fetch matching IDs (using your working logic) ---
        const tokens = tokenize(query);
        const tokenResults = await Promise.all(
          tokens.map(async (token) => {
            const prefix = token.slice(0, 3);
             // Check for global vars needed
            if (typeof baseUrl === 'undefined' || typeof hobby === 'undefined') {
                 throw new Error("Global variables 'baseUrl' or 'hobby' not defined.");
            }
            const filePath = `${baseUrl}${hobby}/posts/search-index/${prefix}.json`;

            try {
                const response = await fetch(filePath);
                // If a prefix file doesn't exist, treat it as no results for that token
                if (!response.ok) {
                    console.warn(`Search index file not found for prefix: ${prefix}. Skipping token.`);
                    return []; // Return empty array for this token
                }
                const searchData = await response.json();
                const matchedWords = Object.keys(searchData).filter((word) =>
                  word.toLowerCase().startsWith(token)
                );
                return matchedWords.flatMap((word) => searchData[word]);
            } catch (fetchError) {
                console.error(`Error fetching search index for prefix ${prefix}:`, fetchError);
                return []; // Return empty on fetch error for this token
            }
          })
        );

        // Calculate intersection, handle cases where a token fetch failed (returned [])
        const resultIds = tokenResults.reduce((acc, curr) => {
            if (acc === null) return curr; // First valid result set
            if (curr.length === 0 || acc.length === 0) return []; // If any set is empty, intersection is empty
            return acc.filter((id) => curr.includes(id));
        }, null); // Start with null to handle the first iteration correctly


        // --- Step 2: Process IDs ---
        if (resultIds && resultIds.length > 0) {
          searchResults.textContent = `Found ${resultIds.length} potential matches. Fetching details...`;

          // --- Step 3: Fetch Details for found IDs ---
          const vnDetailsList = await fetchVNDetails(resultIds);

          if (vnDetailsList.length > 0) {
            // --- Step 4: Render Cards ---
            renderSearchResults(vnDetailsList);
            showIndexContent(false); // Keep index hidden as we have results
          } else {
            searchResults.textContent = 'No results found (failed to load details).';
            showIndexContent(true); // Show index if details failed
          }

        } else {
          // No IDs found from index search
          searchResults.textContent = 'No results found.';
          showIndexContent(true); // Show index if no IDs match
        }
      } catch (error) {
        // Catch errors from Promise.all or initial setup
        console.error('Error during search process:', error);
        searchResults.textContent = 'An error occurred during the search.';
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

  // --- Event Listeners ---
  searchBar.addEventListener('input', debounce((e) => {
    // Only search if we are not viewing details
    if (detailsContainer.style.display === 'none') {
      const query = e.target.value.trim();
      handleSearch(query);
    } else {
        // If user types while details are shown, maybe clear the input?
        // Or just ignore it, as done here.
    }
  }, 300)); // 300ms debounce

  // Optional: Handle navigating back/forward causing details to show/hide
  // If the main script uses hashchange, this might not be strictly necessary
  // unless the search state needs explicit clearing.
   window.addEventListener('hashchange', () => {
       // If the hash change results in the details container being visible, clear search
       // Need a slight delay for the main script's routing to potentially update display style
       setTimeout(() => {
           if (detailsContainer.style.display !== 'none') {
               searchBar.value = '';
               searchResults.innerHTML = '';
               showIndexContent(true); // Ensure index is ready if user navigates back
           }
       }, 50); // Small delay
   });

});
