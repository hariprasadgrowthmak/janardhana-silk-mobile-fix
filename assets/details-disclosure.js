class DetailsDisclosure extends HTMLElement {
  constructor() {
    super();
    this.mainDetailsToggle = this.querySelector('details');
    this.content = this.mainDetailsToggle.querySelector('summary').nextElementSibling;

    this.mainDetailsToggle.addEventListener('focusout', this.onFocusOut.bind(this));
    this.mainDetailsToggle.addEventListener('toggle', this.onToggle.bind(this));
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onToggle() {
    if (!this.animations) this.animations = this.content.getAnimations();

    if (this.mainDetailsToggle.hasAttribute('open')) {
      this.animations.forEach((animation) => animation.play());
    } else {
      this.animations.forEach((animation) => animation.cancel());
    }
  }

  close() {
    this.mainDetailsToggle.removeAttribute('open');
    this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
  }
}

customElements.define('details-disclosure', DetailsDisclosure);

class HeaderMenu extends DetailsDisclosure {
  constructor() {
    super();
    this.header = document.querySelector('.header-wrapper');
    this.isMegaMenu = this.mainDetailsToggle.classList.contains('mega-menu');
    this.closeTimeout = null;

    if (this.isMegaMenu) {
      this.setupMegaMenuHover();
    }
  }

  onFocusOut() {
    super.onFocusOut();
  }

  setupMegaMenuHover() {
    // Open on hover over the summary trigger with intent delay
    this.addEventListener('mouseenter', () => {
      clearTimeout(this.closeTimeout);
      this.openTimeout = setTimeout(() => {
        // Close any other open mega menus first
        document.querySelectorAll('header-menu').forEach((menu) => {
          if (menu !== this && menu.mainDetailsToggle && menu.mainDetailsToggle.hasAttribute('open')) {
            menu.close();
          }
        });
        this.open();
      }, 150); // 150ms delay for hover intent
    });

    // Close on mouseleave from the wrapper
    this.addEventListener('mouseleave', (e) => {
      clearTimeout(this.openTimeout);
      this.closeTimeout = setTimeout(() => {
        this.close();
      }, 300); // 300ms delayed close to allow gap crossing without loss of hover
    });
  }

  open() {
    this.mainDetailsToggle.setAttribute('open', '');
    const summary = this.mainDetailsToggle.querySelector('summary');
    if (summary) summary.setAttribute('aria-expanded', 'true');
  }

  close() {
    clearTimeout(this.closeTimeout);
    this.mainDetailsToggle.removeAttribute('open');
    const summary = this.mainDetailsToggle.querySelector('summary');
    if (summary) summary.setAttribute('aria-expanded', 'false');
  }

  onToggle() {
    if (!this.header) return;
    this.header.preventHide = this.mainDetailsToggle.open;

    if (document.documentElement.style.getPropertyValue('--header-bottom-position-desktop') !== '') return;
    document.documentElement.style.setProperty(
      '--header-bottom-position-desktop',
      `${Math.floor(this.header.getBoundingClientRect().bottom)}px`
    );
  }
}

customElements.define('header-menu', HeaderMenu);
