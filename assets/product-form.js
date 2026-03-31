if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.variantIdInput.disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton.querySelector('span');

        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner').classList.remove('hidden');

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);

        // -- JANARDHANA SILKS: AJAX Add-ons Check --
        const addOnCheckboxes = this.form.querySelectorAll('.saree-add-on-checkbox:checked');
        let payloadItems = [];

        let usingMultiItemPayload = false;
        if (addOnCheckboxes.length > 0) {
          usingMultiItemPayload = true;

          // Add the main product
          let mainItem = {
            id: formData.get('id'),
            quantity: formData.get('quantity') || 1,
            properties: {}
          };

          // Grab all regular properties (like Blouse Design) from formData
          for (let [key, value] of formData.entries()) {
            if (key.includes('properties[') && value !== '') {
              const propName = key.replace('properties[', '').replace(']', '');
              mainItem.properties[propName] = value;
            }
          }
          payloadItems.push(mainItem);

          // Add all selected add-ons
          addOnCheckboxes.forEach(checkbox => {
            const addOnVariantId = checkbox.getAttribute('data-variant-id');
            if (addOnVariantId) {
              payloadItems.push({
                id: addOnVariantId,
                quantity: formData.get('quantity') || 1, // Match quantity of main product
                properties: {
                  '_Attached To': mainItem.id // Hidden property for logic
                }
              });
            }
          });

          // Re-write the fetch config for the items array
          config.headers['Content-Type'] = 'application/json';
          config.body = JSON.stringify({ items: payloadItems });
        } else {
          config.body = formData;
        }

        if (this.cart) {
          if (!usingMultiItemPayload) {
            formData.append('sections', this.cart.getSectionsToRender().map((section) => section.id));
            formData.append('sections_url', window.location.pathname);
          } else {
            // Need to pass sections params inside the JSON body if mult-item
            const parsedBody = JSON.parse(config.body);
            parsedBody.sections = this.cart.getSectionsToRender().map((section) => section.id).join(',');
            parsedBody.sections_url = window.location.pathname;
            config.body = JSON.stringify(parsedBody);
          }
          this.cart.setActiveElement(document.activeElement);
        }

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);

              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButtonText.classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                cartData: response,
              });
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    this.cart.renderContents(response);
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            if (!this.error) this.submitButton.removeAttribute('aria-disabled');
            this.querySelector('.loading__spinner').classList.add('hidden');
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute('disabled');
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }
    }
  );
}
