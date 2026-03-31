class DetailsModal extends HTMLElement {
  constructor() {
    super();
    this.detailsContainer = this.querySelector('details');
    this.summaryToggle = this.querySelector('summary');

    this.detailsContainer.addEventListener('keyup', (event) => event.code.toUpperCase() === 'ESCAPE' && this.close());
    this.summaryToggle.addEventListener('click', this.onSummaryClick.bind(this));
    
    // Identify if this is the search modal
    this.isSearchModal = this.classList.contains('header__search');
    this.searchModalContent = this.querySelector('.search-modal');
    
    // Bind click to the close button inside the modal
    if (this.searchModalContent) {
      const closeBtn = this.searchModalContent.querySelector('button[type="button"]');
      if (closeBtn) closeBtn.addEventListener('click', this.close.bind(this));
    } else {
      const fallbackBtn = this.querySelector('button[type="button"]');
      if (fallbackBtn) fallbackBtn.addEventListener('click', this.close.bind(this));
    }

    this.summaryToggle.setAttribute('role', 'button');
  }

  isOpen() {
    return this.detailsContainer.hasAttribute('open');
  }

  onSummaryClick(event) {
    event.preventDefault();
    event.target.closest('details').hasAttribute('open') ? this.close() : this.open(event);
  }

  onBodyClick(event) {
    const isInsideComponent = this.contains(event.target);
    const isInsideDetachedModal = this.searchModalContent && this.searchModalContent.contains(event.target);
    const isModalOverlay = event.target.classList.contains('modal-overlay');

    if ((!isInsideComponent && !isInsideDetachedModal) || isModalOverlay) {
      this.close(false);
    }
  }

  open(event) {
    this.onBodyClickEvent = this.onBodyClickEvent || this.onBodyClick.bind(this);
    event.target.closest('details').setAttribute('open', true);
    document.body.addEventListener('click', this.onBodyClickEvent);
    
    // Lock Background Scroll (Critical Setup)
    document.body.classList.add('overflow-hidden');
    document.body.classList.add('search-overlay-active');

    // Add visual open class to search modal
    if (this.isSearchModal && this.searchModalContent) {
      
      // SENIOR FIX: Responsive Portal Detachment
      // Only detach to <body> on mobile to escape `transform` blocks
      if (window.innerWidth < 990) {
        if (!this.searchModalPlaceholder) {
          this.searchModalPlaceholder = document.createElement('div');
          this.searchModalPlaceholder.style.display = 'none';
          this.searchModalContent.parentNode.insertBefore(this.searchModalPlaceholder, this.searchModalContent);
        }
        if (this.searchModalContent.parentNode !== document.body) {
          document.body.appendChild(this.searchModalContent);
        }
      } else {
        // Restore to original location on desktop
        if (this.searchModalPlaceholder && this.searchModalContent.parentNode !== this.searchModalPlaceholder.parentNode) {
          this.searchModalPlaceholder.parentNode.insertBefore(this.searchModalContent, this.searchModalPlaceholder);
        }
      }

      this.searchModalContent.classList.add('search-modal--active');

      // Set announcement bar height as CSS variable for search positioning
      if (window.innerWidth < 990) {
        const announcementBar = document.querySelector('.announcement-bar-section');
        const barHeight = announcementBar ? announcementBar.offsetHeight : 0;
        document.documentElement.style.setProperty('--announcement-bar-height', barHeight + 'px');
      }
    }

    // Hide navigation and close any open mega menus when search opens
    const headerWrapper = this.closest('.header-wrapper');
    if (headerWrapper) {
      headerWrapper.classList.add('search-open');
    }
    document.querySelectorAll('header-menu').forEach((menu) => {
      if (menu.mainDetailsToggle && menu.mainDetailsToggle.open) {
        menu.close();
      }
    });

    const targetContainer = this.searchModalContent ? this.searchModalContent : this.detailsContainer;
    trapFocus(
      targetContainer.querySelector('[tabindex="-1"]'),
      targetContainer.querySelector('input:not([type="hidden"])')
    );
  }

  close(focusToggle = true) {
    removeTrapFocus(focusToggle ? this.summaryToggle : null);
    this.detailsContainer.removeAttribute('open');
    document.body.removeEventListener('click', this.onBodyClickEvent);
    
    // Unlock Background Scroll
    document.body.classList.remove('overflow-hidden');
    document.body.classList.remove('search-overlay-active');

    // Remove visual open class from search modal
    if (this.isSearchModal && this.searchModalContent) {
      this.searchModalContent.classList.remove('search-modal--active');
      
      // Clean up portal: return to original DOM location when closed
      if (this.searchModalPlaceholder && this.searchModalContent.parentNode !== this.searchModalPlaceholder.parentNode) {
        this.searchModalPlaceholder.parentNode.insertBefore(this.searchModalContent, this.searchModalPlaceholder);
      }
    }

    // Restore navigation when search closes
    const headerWrapper = this.closest('.header-wrapper');
    if (headerWrapper) {
      headerWrapper.classList.remove('search-open');
    }
  }
}

customElements.define('details-modal', DetailsModal);
