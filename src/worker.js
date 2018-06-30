import Prism from './prism';

self.addEventListener('message', (e) => {
    const message = e.data;
    console.log(message.options);
    const prism = new Prism(message.options);
    const result = prism.refract(message.code, message.lang);

    function _reply() {
        self.postMessage({
            id: message.id,
            lang: message.lang,
            result
        });
    }

    setTimeout(() => {
        _reply();
    }, message.options.delay * 1000);
});
