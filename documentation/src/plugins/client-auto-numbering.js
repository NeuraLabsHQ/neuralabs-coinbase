import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

if (ExecutionEnvironment.canUseDOM) {
  // Function to add hierarchical numbering
  function addHierarchicalNumbering() {
    // Only apply to documentation pages
    const article = document.querySelector('article');
    if (!article || !window.location.pathname.includes('/docs/')) {
      return;
    }

    // Counter objects for different heading levels
    // We start from h2 since h1 is the page title
    const counters = {
      h2: 0,
      h3: 0,
      h4: 0,
      h5: 0,
      h6: 0
    };

    // Get all headings within the article, excluding h1
    const headings = article.querySelectorAll('h2, h3, h4, h5, h6');
    
    headings.forEach(heading => {
      // Skip if already numbered or has specific class to exclude
      if (heading.classList.contains('no-numbering') || 
          heading.querySelector('.heading-number') ||
          heading.closest('.theme-admonition') ||
          heading.closest('.card') ||
          heading.classList.contains('card-title')) {
        return;
      }

      const tagName = heading.tagName.toLowerCase();
      const level = parseInt(tagName.charAt(1));
      
      // Increment current level counter
      counters[tagName]++;
      
      // Reset all lower level counters
      for (let i = level + 1; i <= 6; i++) {
        counters[`h${i}`] = 0;
      }
      
      // Build the number string starting from h2 as level 1
      let numberString = '';
      for (let i = 2; i <= level; i++) {
        const count = counters[`h${i}`];
        if (count > 0) {
          if (numberString) numberString += '.';
          numberString += count;
        }
      }
      
      // Always add numbering for h2 and below
      if (numberString) {
        // Create number element
        const numberSpan = document.createElement('span');
        numberSpan.className = 'heading-number';
        numberSpan.textContent = numberString + ' ';
        
        // Insert at the beginning of the heading
        heading.insertBefore(numberSpan, heading.firstChild);
      }
    });
  }

  // Apply numbering on page load
  window.addEventListener('load', () => {
    setTimeout(addHierarchicalNumbering, 100);
  });

  // Re-apply on route changes (for SPA navigation)
  if (window.history && window.history.pushState) {
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      setTimeout(addHierarchicalNumbering, 100);
    };
  }

  // Also listen for popstate (back/forward navigation)
  window.addEventListener('popstate', () => {
    setTimeout(addHierarchicalNumbering, 100);
  });
}