import * as Rainbow from '../src/rainbow.js';
import {extend} from '../src/rainbow.js';

/////////////////////////
// Helpers and globals //
/////////////////////////

const expect = chai.expect;

const genericPatterns = [{
    name: 'test',
    pattern: /test/gi
}];

const patternA = [{
    name: 'a',
    pattern: /here/gi
}];

const patternB = [{
    name: 'b',
    pattern: /is/gi
}];

const patternDollar = [{
    name: 'dollar',
    pattern: /'\$'/g
}];

////////////////
// Test suite //
////////////////

suite('Rainbow', () => {

    test('Basic things are defined', () => {
        console.log(typeof Rainbow.color);
        expect(Rainbow).to.exist;
        // expect(Rainbow.color).to.be.a('function');
        expect(extend).to.be.a('function');
        expect(Rainbow.onHighlight).to.be.a('function');
        expect(Rainbow.addAlias).to.be.a('function');
    });

    test('Should apply global class', async () => {
        extend('generic', [{
            name: 'name',
            pattern: /Craig/gm
        }]);

        const {result} = await Rainbow.color('My name is Craig', { language: 'generic', globalClass: 'global' });
        expect(result).to.equal('My name is <span class="name global">Craig</span>');
    });

    test('Should properly use patterns', async () => {
        extend('generic', genericPatterns);

        const {result} = await Rainbow.color('here is a test', 'generic');
        expect(result).to.equal('here is a <span class="test">test</span>');
    });

    test('Should properly extend generic patterns', async () => {
        extend('newLanguage', patternA, 'generic');

        const {result} = await Rainbow.color('here is a test', 'newLanguage');
        expect(result).to.equal('<span class="a">here</span> is a <span class="test">test</span>');
    });

    test('Should properly extend other patterns that extend generic patterns', async () => {
        extend('newLanguage', patternB);

        const {result} = await Rainbow.color('here is a test', 'newLanguage')
        expect(result).to.equal('<span class="a">here</span> <span class="b">is</span> a <span class="test">test</span>');
    });

    test('Should properly apply aliases', async () => {
        Rainbow.addAlias('new', 'newLanguage');

        const {result} = await Rainbow.color('here is a test', 'new');
        expect(result).to.equal('<span class="a">here</span> <span class="b">is</span> a <span class="test">test</span>');
    });

    test('Should properly remove language', async () => {
        extend('foo', genericPatterns);

        const {result} = await Rainbow.color('just a test', 'foo');
        expect(result).to.equal('just a <span class="test">test</span>');

        Rainbow.remove('foo');

        const {result: result2} = await Rainbow.color('just a test', 'foo');
        expect(result2).to.equal('just a test');
    });

    // Not sure why anyone would want this behavior, but since we are faking
    // global regex matches we should make sure this works too.
    test('Should work with non global regex matches', async () => {
        Rainbow.remove('foo');
        extend('foo', [
            {
                name: 'number',
                pattern: /\b\d+\b/
            }
        ]);

        const {result} = await Rainbow.color('123 456 789', 'foo');
        expect(result).to.equal('<span class="number">123</span> 456 789');
    });

    test('Should support dollar signs in replacements', async () => {
        extend('dollarLanguage', patternDollar);

        const {result} = await Rainbow.color('here is a test with a \'$\' sign in it', 'dollarLanguage');
        expect(result).to.equal('here is a test with a <span class="dollar">\'$\'</span> sign in it');
    });

    test.only('Should color ShadowRoots', async () => {
        extend('generic', genericPatterns);
        const container = document.createElement('div');
        const shadowRoot = container.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = `
          <pre>
            <code data-language="generic">
                here is a test 
            </code>
          </pre>
        `;
        await Rainbow.color(shadowRoot);
        console.log(shadowRoot.innerHTML);
        expect(shadowRoot.innerHTML).to.equal('here is a <span class="test">test</span>');
    });
});
