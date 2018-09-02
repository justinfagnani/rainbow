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

    return html`<slot></slot>
      <style>
        :host {
          display: block;
          position: relative;
        }
        code {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          white-space: pre;
          margin: 0;
        }
      </style>
      <link rel="stylesheet" href="${this.theme}">
      <code>${colorPromise}</code>
    `;
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
