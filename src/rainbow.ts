/**
 * Copyright 2012-2016 Craig Campbell
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Rainbow is a simple code syntax highlighter
 *
 * @see rainbowco.de
 */
import {Options as PrismOptions, Pattern} from './prism.js';
import {getLanguageForBlock} from './util.js';

declare global {
  interface ImportMeta {
    url: string;
  }
}

/**
 * An array of the language patterns specified for each language
 */
const patterns: {[name: string]: Pattern[]} = {};

/**
 * An object of languages mapping to what language they should inherit from
 */
const inheritenceMap: {[name: string]: string} = {};

/**
 * A mapping of language aliases
 */
const aliases: {[name: string]: string} = {};

/**
 * Callback to fire after each block is highlighted
 */
let onHighlightCallback: Function|null;

/**
 * Counter for block ids
 * @see https://github.com/ccampbell/rainbow/issues/207
 */
let id = 0;

let cachedWorker: Worker|undefined = undefined;
function _getWorker(): Worker {
  if (cachedWorker === undefined) {
    const url = new URL('../worker-bundled.js', import.meta.url);
    cachedWorker = new Worker(url.toString());
  }
  return cachedWorker!;
}

/**
 * Helper for matching up callbacks directly with the
 * post message requests to a web worker.
 *
 * @param message      data to send to web worker
 */
const _messageWorker =
    (message: any): Promise<{result : string, lang : string}> =>
        new Promise((resolve) => {
          const worker = _getWorker();

          const _listen =
              (e: MessageEvent) => {
                if (e.data.id === message.id) {
                  worker.removeEventListener('message', _listen);
                  resolve(e.data);
                }
              }

                                   worker.addEventListener('message', _listen);
          worker.postMessage(message);
        });

/**
 * Browser Only - Handles response from web worker, updates DOM with
 * resulting code, and fires callback
 */
function _generateHandler(element: Element) {
  return function _handleResponseFromWorker(data: any) {
    element.innerHTML = data.result;
    element.classList.remove('loading');
    element.classList.add('rainbow-show');

    if (element.parentElement && element.parentElement.tagName === 'PRE') {
      element.parentElement.classList.remove('loading');
      element.parentElement.classList.add('rainbow-show');
    }

    // element.addEventListener('animationend', (e) => {
    //     if (e.animationName === 'fade-in') {
    //         setTimeout(() => {
    //             element.classList.remove('decrease-delay');
    //         }, 1000);
    //     }
    // });

    if (onHighlightCallback) {
      onHighlightCallback(element, data.lang);
    }
  };
}

/**
 * Gets options needed to pass into Prism
 *
 * @param {object} options
 * @return {object}
 */
function _getPrismOptions(options: PrismOptions): PrismOptions {
  return {
    patterns,
    inheritenceMap,
    aliases,
    globalClass : options.globalClass,
    delay : !isNaN(options.delay) ? options.delay : 0
  };
}

/**
 * Gets data to send to webworker
 */
function _getWorkerData(code: string, lang: string|any) {
  let options: any = {};
  let language: string;

  if (typeof lang === 'object') {
    options = lang;
    language = options.language;
  } else {
    language = lang;
  }

  language = aliases[language] || language;

  const workerData = {
    id : id++,
    code,
    lang : language,
    options : _getPrismOptions(options),
  };

  return workerData;
}

/**
 * Browser Only - Sends messages to web worker to highlight elements passed
 * in
 */
async function _highlightCodeBlocks(codeBlocks: Element[]) {
  const promises = [];

  for (const block of codeBlocks) {
    const language = getLanguageForBlock(block);
    if (block.classList.contains('rainbow') || !language) {
      continue;
    }

    // This cancels the pending animation to fade the code in on load
    // since we want to delay doing this until it is actually
    // highlighted
    block.classList.add('loading');
    block.classList.add('rainbow');

    // We need to make sure to also add the loading class to the pre tag
    // because that is how we will know to show a preloader
    if (block.parentElement && block.parentElement.tagName === 'PRE') {
      block.parentElement.classList.add('loading');
    }

    const globalClass = block.getAttribute('data-global-class');
    const delay = parseInt(block.getAttribute('data-delay')!, 10);

    promises.push(_messageWorker(_getWorkerData(block.innerHTML,
                                                {language, globalClass, delay}))
                      .then(_generateHandler(block)));
  }
  await Promise.all(promises);
}

function _addPreloader(preBlock: Element) {
  const preloader = document.createElement('div');
  preloader.className = 'preloader';
  for (let i = 0; i < 7; i++) {
    preloader.appendChild(document.createElement('div'));
  }
  preBlock.appendChild(preloader);
}

/**
 * Browser Only - Start highlighting all the code blocks
 *
 * @param node       HTMLElement to search within
 */
async function _highlight(node?: Element|Document) {
  // The first argument can be an Event or a DOM Element.
  //
  // I was originally checking instanceof Event but that made it break
  // when using mootools.
  //
  // @see https://github.com/ccampbell/rainbow/issues/32
  node = node || document;

  const preBlocks = node.querySelectorAll('pre');
  const codeBlocks = node.querySelectorAll('code');
  const finalPreBlocks = [];
  const finalCodeBlocks = [];

  // First loop through all pre blocks to find which ones to highlight
  for (const preBlock of Array.from(preBlocks)) {
    _addPreloader(preBlock);

    // Strip whitespace around code tags when they are inside of a pre
    // tag.  This makes the themes look better because you can't
    // accidentally add extra linebreaks at the start and end.
    //
    // When the pre tag contains a code tag then strip any extra
    // whitespace.
    //
    // For example:
    //
    // <pre>
    //      <code>var foo = true;</code>
    // </pre>
    //
    // will become:
    //
    // <pre><code>var foo = true;</code></pre>
    //
    // If you want to preserve whitespace you can use a pre tag on
    // its own without a code tag inside of it.
    if (preBlock.querySelectorAll('code').length) {

      // This fixes a race condition when Rainbow.color is called before
      // the previous color call has finished.
      if (!preBlock.getAttribute('data-trimmed')) {
        preBlock.setAttribute('data-trimmed', 'true');
        preBlock.innerHTML = preBlock.innerHTML.trim();
      }
      continue;
    }

    // If the pre block has no code blocks then we are going to want to
    // process it directly.
    finalPreBlocks.push(preBlock);
  }

  // @see
  // http://stackoverflow.com/questions/2735067/how-to-convert-a-dom-node-list-to-an-array-in-javascript
  // We are going to process all <code> blocks
  for (const codeBlock of Array.from(codeBlocks)) {
    finalCodeBlocks.push(codeBlock);
  }

  return _highlightCodeBlocks(finalCodeBlocks.concat(finalPreBlocks));
}

/**
 * Callback to let you do stuff in your app after a piece of code has
 * been highlighted
 */
export function onHighlight(callback: Function) {
  onHighlightCallback = callback;
}

/**
 * Extends the language pattern matches
 *
 * @param language            name of language
 * @param languagePatterns    object of patterns to add on
 * @param inherits  optional language that this language
 *                                     should inherit rules from
 */
export function extend(language: string, languagePatterns: Pattern[],
                       inherits?: string) {

  // If we extend a language again we shouldn't need to specify the
  // inheritence for it. For example, if you are adding special highlighting
  // for a javascript function that is not in the base javascript rules, you
  // should be able to do
  //
  // extend('javascript', [ … ]);
  //
  // Without specifying a language it should inherit (generic in this case)
  if (!inheritenceMap[language]) {
    inheritenceMap[language] = inherits!;
  }

  patterns[language] = languagePatterns.concat(patterns[language] || []);
}

export function remove(language: string) {
  delete inheritenceMap[language];
  delete patterns[language];
}

type ColorResult = {
  result: string,
  lang: string
};

/**
 * Starts the magic rainbow
 */
export async function color(): Promise<void>;
export async function color(element: Element|ShadowRoot): Promise<void>;
export async function color(code: string,
                            language: string): Promise<ColorResult>;
export async function color(...args: any[]): Promise<ColorResult|void> {
  // If you want to straight up highlight a string you can pass the
  // string of code, and the language.

  // Example:
  //
  // Rainbow.color(code, language), function(highlightedCode, language) {
  //     // this code block is now highlighted
  // });
  if (typeof args[0] === 'string') {
    const [code, language] = args;
    const workerData = _getWorkerData(code, language);
    const {result, lang} = await _messageWorker(workerData);
    return {result, lang};
  }

  if (args.length === 0) {
    const result = await _highlight();
    return;
  }

  // Otherwise we use whatever node you passed in with an optional
  // callback function as the second parameter.
  //
  // Example:
  //
  // var preElement = document.createElement('pre');
  // var codeElement = document.createElement('code');
  // codeElement.setAttribute('data-language', 'javascript');
  // codeElement.innerHTML = '// Here is some JavaScript';
  // preElement.appendChild(codeElement);
  // Rainbow.color(preElement, function() {
  //     // New element is now highlighted
  // });
  //
  // If you don't pass an element it will default to `document`
  return _highlight(args[0]);
}

/**
 * Method to add an alias for an existing language.
 *
 * For example if you want to have "coffee" map to "coffeescript"
 *
 * @see https://github.com/ccampbell/rainbow/issues/154
 * @return {void}
 */
export function addAlias(alias: string, originalLanguage: string) {
  aliases[alias] = originalLanguage;
}
