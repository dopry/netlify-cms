import sanitizeFilename from 'sanitize-filename';
import { isString, escapeRegExp } from 'lodash';

function getUrl(url, direct) {
  return `${ direct ? '/#' : '' }${ url }`;
}

export function getCollectionUrl(collectionName, direct) {
  return getUrl(`/collections/${ collectionName }`, direct);
}

export function getNewEntryUrl(collectionName, direct) {
  return getUrl(`/collections/${ collectionName }/entries/new`, direct);
}

/* See https://www.w3.org/International/articles/idn-and-iri/#path.
 * According to the new IRI (Internationalized Resource Identifier) spec, RFC 3987,
 *   - ASCII chars should be kept the same way as in standard URIs (letters digits _ - . ~).
 *   - Non-ASCII chars (unless they are not in the allowed "ucschars" list) should be percent-encoded.
 *   - If the string is not encoded in Unicode, it should be converted to UTF-8 and normalized first
 * 
 *  JS stores strings as UTF-16/UCS-2 internally, so we should not normalize.
 */

 // supporter latin characters for URI testing.
const uriChars = /[\w\-.~]/i;

// supported unicode characters for IRI testing.
const ucsChars = /[\xA0-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFEF}\u{10000}-\u{1FFFD}\u{20000}-\u{2FFFD}\u{30000}-\u{3FFFD}\u{40000}-\u{4FFFD}\u{50000}-\u{5FFFD}\u{60000}-\u{6FFFD}\u{70000}-\u{7FFFD}\u{80000}-\u{8FFFD}\u{90000}-\u{9FFFD}\u{A0000}-\u{AFFFD}\u{B0000}-\u{BFFFD}\u{C0000}-\u{CFFFD}\u{D0000}-\u{DFFFD}\u{E1000}-\u{EFFFD}]/u;

/**
 * validate a character against valid IRI characters. 
 * @param {char} char character to validate.
 * @return {bool}
 */
function validIRIChar(char) { 
  return uriChars.test(char) || ucsChars.test(char);
}

/**
 * validate every character in a string
 * @param {string} str string to validate.
 * @return {bool}
 */
function validIRIString(str) {
  return Array.from(str).every(validIRIChar);
}

/**
 * replace IRI unsupported code points with a provided string.
 * @param {string} str  - string to sanitize
 * @param {string} replacment character to replace invalid characters, default: '-'
 * @return {string}
 */
export function sanitizeIRI(str, replacement = '-') {
  if (!isString(str)) throw "The input slug must be a string.";
  if (!isString(replacement)) throw "`replacement` must be a string.";
  if(!validIRIString(replacement)) throw "`replacement` must be a valid IRI string.";
  return Array.from(str).map(char => (validIRIChar(char) ? char : replacement)).join('');
}

/**
 * Replace characters we do not support in URLs with a provided string.
 * @param {string} str string to sanitize.
 * @param {string} replacment character to replace invalid characters, default: '-'
 * @return {string}
 */
export function sanitizeSlug(str, replacement = '-') {
  if (!isString(str)) throw "The input slug must be a string.";
  if (!isString(replacement)) throw "`replacement` must be a string.";
  const doubleReplacement = new RegExp('(' + escapeRegExp(replacement) + '+)', 'g');
  const trailingReplacment = new RegExp(escapeRegExp(replacement) + '$');
  
  const sanitizedIRISlug =  sanitizeIRI(str, replacement);
  const sanitizedFilenameSlug = sanitizeFilename(sanitizedIRISlug, { replacement })
  const undoubledSlug = sanitizedFilenameSlug.replace(doubleReplacement, replacement);
  const strippedTrailingSlug = undoubledSlug.replace(trailingReplacment, '');
  return strippedTrailingSlug;
}
