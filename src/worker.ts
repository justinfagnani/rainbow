import Prism from './prism';

self.addEventListener('message', (e) => {
  const message = e.data;
  const prism = new Prism(message.options);
  const result = prism.refract!(message.code, message.lang);

  function _reply() {
    postMessage({id : message.id, lang : message.lang, result});
  }

  setTimeout(() => { _reply(); }, message.options.delay * 1000);
});

declare function postMessage(message: any, transfer?: any[]|undefined): void
