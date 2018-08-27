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
        return node;
      })();
    }

    return html`
      <style>
        code {
          white-space: pre;
        }
      </style>
      <link rel="stylesheet" href="${this.theme}">
      <pre>${colorPromise}</pre>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this._mutationObserver =
        new MutationObserver((records) => { this.invalidate(); });
    this._mutationObserver.observe(this, {
      childList : true,
      characterData : true,
    });
  }
}
customElements.define('rainbow-code', RainbowCode);
