describe('Test Setup', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  it('should have fast-check available', () => {
    const fc = require('fast-check');
    expect(fc).toBeDefined();
  });
});
