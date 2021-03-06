
/**
 * Browser Only - Gets the language for this block of code
 */
export function getLanguageForBlock(block: Element): string|null {

  // If this doesn't have a language but the parent does then use that.
  //
  // This means if for example you have: <pre data-language="php">
  // with a bunch of <code> blocks inside then you do not have
  // to specify the language for each block.
  let language =
      block.getAttribute('data-language') ||
      block.parentElement && block.parentElement!.getAttribute('data-language');

  // This adds support for specifying language via a CSS class.
  //
  // You can use the Google Code Prettify style: <pre class="lang-php">
  // or the HTML5 style: <pre><code class="language-php">
  if (!language) {
    const pattern = /\blang(?:uage)?-(\w+)/;
    const match =
        block.className.match(pattern) ||
        block.parentElement && block.parentElement.className.match(pattern);

    if (match) {
      language = match[1];
    }
  }

  if (language) {
    return language.toLowerCase();
  }

  return null;
}

/**
 * Determines if two different matches have complete overlap with each other
 *
 * @param start1   start position of existing match
 * @param end1     end position of existing match
 * @param start2   start position of new match
 * @param end2     end position of new match
 */
export function hasCompleteOverlap(start1: number, end1: number, start2: number,
                                   end2: number): boolean {

  // If the starting and end positions are exactly the same
  // then the first one should stay and this one should be ignored.
  if (start2 === start1 && end2 === end1) {
    return false;
  }

  return start2 <= start1 && end2 >= end1;
}

/**
 * Encodes < and > as html entities
 */
export function htmlEntities(code: string): string {
  return code.replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/&(?![\w\#]+;)/g, '&amp;');
}

/**
 * Finds out the position of group match for a regular expression
 *
 * @see
 * http://stackoverflow.com/questions/1985594/how-to-find-index-of-groups-in-match
 */
export function indexOfGroup(match: RegExpMatchArray,
                             groupNumber: number): number {
  let index = 0;

  for (let i = 1; i < groupNumber; ++i) {
    if (match[i]) {
      index += match[i].length;
    }
  }

  return index;
}

/**
 * Determines if a new match intersects with an existing one
 *
 * @param start1    start position of existing match
 * @param end1      end position of existing match
 * @param start2    start position of new match
 * @param end2      end position of new match
 */
export function intersects(start1: number, end1: number, start2: number,
                           end2: number): boolean {
  if (start2 >= start1 && start2 < end1) {
    return true;
  }

  return end2 > start1 && end2 < end1;
}

/**
 * Sorts an objects keys by index descending
 */
export function keys(object: any): any[] {
  const locations = [];

  for (const location in object) {
    if (object.hasOwnProperty(location)) {
      locations.push(location);
    }
  }

  // numeric descending
  return locations.sort((a: any, b: any) => b - a);
}

/**
 * Substring replace call to replace part of a string at a certain position
 *
 * @param position         the position where the replacement
 *                                  should happen
 * @param replace          the text we want to replace
 * @param replaceWith      the text we want to replace it with
 * @param code             the code we are doing the replacing in
 */
export function replaceAtPosition(position: number, replace: string,
                                  replaceWith: string, code: string): string {
  const subString = code.substr(position);

  // This is needed to fix an issue where $ signs do not render in the
  // highlighted code
  //
  // @see https://github.com/ccampbell/rainbow/issues/208
  replaceWith = replaceWith.replace(/\$/g, '$$$$')

  return code.substr(0, position) + subString.replace(replace, replaceWith);
}
