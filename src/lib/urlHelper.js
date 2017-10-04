import sanitizeFilename from 'sanitize-filename';
import { isString, escapeRegExp, flow, partialRight } from 'lodash';

function getUrl(url, direct) {
  return `${ direct ? '/#' : '' }${ url }`;
}

export function getCollectionUrl(collectionName, direct) {
  return getUrl(`/collections/${ collectionName }`, direct);
}

export function getNewEntryUrl(collectionName, direct) {
  return getUrl(`/collections/${ collectionName }/entries/new`, direct);
}

/**
 * @see https://www.w3.org/International/articles/idn-and-iri/#path.
 *
 * According to the new IRI (Internationalized Resource Identifier) spec, RFC 3987,
 *   - ASCII chars should be kept the same way as in standard URIs (letters digits _ - . ~).
 *   - Non-ASCII chars (unless they are not in the allowed "ucschars" list) should be percent-encoded.
 *   - If the string is not encoded in Unicode, it should be converted to UTF-8 and normalized first,
 *   
 * JS stores strings as UTF-16/UCS-2 internally, so we should not normallize. 
 */

// valid latin URI characters.
const uriChars = /[\w\-.~]/i;

// valid Unicode IRI characters.
const ucsChars = /[\xA0-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFEF}\u{10000}-\u{1FFFD}\u{20000}-\u{2FFFD}\u{30000}-\u{3FFFD}\u{40000}-\u{4FFFD}\u{50000}-\u{5FFFD}\u{60000}-\u{6FFFD}\u{70000}-\u{7FFFD}\u{80000}-\u{8FFFD}\u{90000}-\u{9FFFD}\u{A0000}-\u{AFFFD}\u{B0000}-\u{BFFFD}\u{C0000}-\u{CFFFD}\u{D0000}-\u{DFFFD}\u{E1000}-\u{EFFFD}]/u;

/**
 * Validate IRI characters.
 * @param {char} char 
 * @return {bool} returns true if a character is valid for use in an IRI. 
 */
function validIRIChar (char) {
  return uriChars.test(char) || ucsChars.test(char);
}

/**
 * @typedef SanitizeIRIOptions
 * @param {string} replacement a valid IRI replacement character to be substitude for invalid characters.
 */

/**
 * Replace invalid IRI characters in a string with a specified replacement. 
 * @see https://www.w3.org/International/articles/idn-and-iri/#path
 * 
 * @param {string} str 
 * @param {SanitizeIRIOptions} options
 */
export function sanitizeIRI(str, { replacement = "" } = {}) {
  if (!isString(str)) throw "The input slug must be a string.";
  if (!isString(replacement)) throw "`options.replacement` must be a string.";

  // Check and make sure the replacement character is actually a safe char itself.
  if (!Array.from(replacement).every(validIRIChar)) throw "The replacement character(s) (options.replacement) is itself unsafe.";

  // Use `Array.from` instead of `String.split`, so unicode points > U+FFFF will not be split into 
  // UTF-16 Surrogate Pairs.
  // @see https://mathiasbynens.be/notes/javascript-unicode
  return Array.from(str).map(char => (validIRIChar(char) ? char : replacement)).join('');
}

/**
 * replace characters not supported by netlify-cms slugs with a specified replacement.
 * @param {string} str 
 * @param {SanitizeIRIOptions} options
 */
export function sanitizeSlug(str, { replacement = '-' } = {}) {
  if (!isString(str)) throw "The input slug must be a string.";
  if (!isString(replacement)) throw "`options.replacement` must be a string.";
  
  // Sanitize as IRI (i18n URI), then as filename.
  const sanitize = flow([
    partialRight(sanitizeIRI, { replacement }),
    partialRight(sanitizeFilename, { replacement }),
  ]);
  const sanitizedSlug = sanitize(str);
  
  // Remove any doubled or trailing replacement characters (that were added in the sanitizers).
  const doubleReplacement = new RegExp('(?:' + escapeRegExp(replacement) + ')+', 'g');
  const trailingReplacment = new RegExp(escapeRegExp(replacement) + '$');
  const normalizedSlug = sanitizedSlug
    .replace(doubleReplacement, replacement)
    .replace(trailingReplacment, '');

  return normalizedSlug;
}

