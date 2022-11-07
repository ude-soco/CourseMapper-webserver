import { ByPassUrlSanitizationPipe } from './by-pass-url-sanitization.pipe';

describe('ByPassUrlSanitizationPipe', () => {
  it('create an instance', () => {
    const pipe = new ByPassUrlSanitizationPipe();
    expect(pipe).toBeTruthy();
  });
});
