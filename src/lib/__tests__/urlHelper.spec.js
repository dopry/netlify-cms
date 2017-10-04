import { sanitizeIRI, sanitizeSlug } from '../urlHelper';

describe('sanitizeIRI', () => {
  // `sanitizeIRI` tests from RFC 3987
  it('should keep valid URI chars (letters digits _ - . ~)', () => {
    expect(
      sanitizeIRI("This, that-one_or.the~other 123!")
    ).toEqual('This--that-one_or.the~other-123-');
  });
  
  it('should not remove accents', () => {
    expect(
      sanitizeIRI("ěščřžý")
    ).toEqual('ěščřžý');
  });
  
  it('should keep valid non-latin chars (ucschars in RFC 3987)', () => {
    expect(
      sanitizeIRI("日本語のタイトル")
    ).toEqual('日本語のタイトル');
  });

  it('should not normalize Unicode strings', () => {
    expect(
      sanitizeIRI('\u017F\u0323\u0307')
    ).toEqual('\u017F\u0323\u0307');
    expect(
      sanitizeIRI('\u017F\u0323\u0307')
    ).not.toEqual('\u1E9B\u0323');
  });
  
  it('should allow a custom replacement character', () => {
    expect(
      sanitizeIRI("duck\\goose.elephant", '_')
    ).toEqual('duck_goose.elephant');
  });
  
  it('should not allow an improper replacement character', () => {
    expect(() => {
      sanitizeIRI("I! like! dollars!", '$' );
     }).toThrow();
  });
  
  it('should not actually URI-encode the characters', () => {
    expect(
      sanitizeIRI("🎉")
    ).toEqual('🎉');
    expect(
      sanitizeIRI("🎉")
    ).not.toEqual("%F0%9F%8E%89");
  });
});


describe('sanitizeSlug', ()=> {
  
  it('throws an error for non-strings', () => {
    expect(() => sanitizeSlug({})).toThrowError("The input slug must be a string.");
    expect(() => sanitizeSlug([])).toThrowError("The input slug must be a string.");
    expect(() => sanitizeSlug(false)).toThrowError("The input slug must be a string.");
    expect(() => sanitizeSlug(null)).toThrowError("The input slug must be a string.");
    expect(() => sanitizeSlug(11234)).toThrowError("The input slug must be a string.");
    expect(() => sanitizeSlug(undefined)).toThrowError("The input slug must be a string.");
    expect(() => sanitizeSlug(()=>{})).toThrowError("The input slug must be a string.");
  });

  it('throws an error for non-string replacements', () => {
    expect(() => sanitizeSlug('test', {})).toThrowError("`replacement` must be a string.");
    expect(() => sanitizeSlug('test', [])).toThrowError("`replacement` must be a string.");
    expect(() => sanitizeSlug('test', false)).toThrowError("`replacement` must be a string.");
    expect(() => sanitizeSlug('test', null)).toThrowError("`replacement` must be a string.");
    expect(() => sanitizeSlug('test', 11232)).toThrowError("`replacement` must be a string.");
    // do not test undefined for this variant since a default is set in the cosntructor. 
    expect(() => sanitizeSlug('test', undefined )).not.toThrow();
    expect(() => sanitizeSlug('test', ()=>{})).toThrowError("`replacement` must be a string.");
  });

  it('should keep valid URI chars (letters digits _ - . ~)', () => {
    expect(
      sanitizeSlug("This, that-one_or.the~other 123!")
    ).toEqual('This-that-one_or.the~other-123');
  });

  it('removes double replacements', () => {
    expect(sanitizeSlug('test--test')).toEqual('test-test');
     expect(sanitizeSlug('test   test')).toEqual('test-test');
  });

  it('removes trailing replacemenets', () => {
    expect(sanitizeSlug('test   test   ')).toEqual('test-test');
  });

  it('uses alternate replacements', () => {
    expect(sanitizeSlug('test   test   ', '_')).toEqual('test_test');
  });

});