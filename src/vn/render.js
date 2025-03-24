    function renderVisualNovels(posts) {
      const vnList = document.getElementById('vn-list');
      vnList.innerHTML = posts.map(vn => `
        <div class="vn-container">
          <div class="vn-title">
            <a href="#" data-vn-link="${vn.link}">${vn.title}</a>
          </div>
          <div class="vn-description">${vn.description}</div>
          ${vn.image?.url ? `<img class="vn-image" src="${vn.image.url}" alt="${vn.title}">` : ''}
        </div>
      `).join('');

      // Add event listeners to visual novel links
      document.querySelectorAll('.vn-title a').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const vnLink = e.target.getAttribute('data-vn-link');
          fetchAndRenderDetails(vnLink);
        });
      });
    }
