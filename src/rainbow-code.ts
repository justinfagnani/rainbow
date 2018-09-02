import {html, LitElement, property} from '@polymer/lit-element';

import {color} from './rainbow.js';

export class RainbowCode extends LitElement {

  @property() language?: string;

  @property() theme?: string;

  _mutationObserver!: MutationObserver;

  render() {
    let colorPromise = undefined;
    if (this.textContent !== null && this.language !== undefined) {
      colorPromise = (async () => {
        const tmp = document.createElement('template');
        const {result} =
            await color(this.textContent!, this.language || 'generic');
        tmp.innerHTML = result;
        const node = document.importNode(tmp.content, true);
        this.setAttribute('highlighted', '');
        return node;
      })();
    }

    // Use comments to avoid whitespace becuase of `white-space: pre`, which
    // applies to both light and shadow dom.
    return html`<!--
    --><style>
        :host {
          display: block;
          position: relative;
          /* Create a stacking context, so we can push light dom to the top */
          z-index: 1;
        }
        /* Once the code is highlighted, hide the original source, but leave it
           laid out so that outlines will be in the right place. */
        :host([highlighted]) {
          color: transparent;
        }
        code {
          position: absolute;
          font-family: inherit;
          /* rainbow-code and code's padding need to match to align text */
          padding: var(--padding);
          margin: 0;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          white-space: pre;
          color: var(--color, white);
          /* So that light dom content is above and can hide code */
          z-index: -1;
        }
      </style><!--
      --><link rel="stylesheet" href="${this.theme}"><!--
      --><code>${colorPromise}</code><slot></slot>`;
  }

  connectedCallback() {
    super.connectedCallback();
    this._mutationObserver =
        new MutationObserver((records) => { this.requestUpdate(); });
    this._mutationObserver.observe(this, {
      childList : true,
      characterData : true,
    });
  }
}
customElements.define('rainbow-code', RainbowCode);
