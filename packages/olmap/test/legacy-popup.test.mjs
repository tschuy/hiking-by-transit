import assert from 'node:assert/strict';
import test from 'node:test';
import { renderLegacyPopupContent } from '../dist/dom.js';

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName;
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.textContent = '';
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = [...children]; }
}

test('legacy popup renders untrusted descriptions as text, not markup', () => {
  const ownerDocument = { createElement: (tagName) => new FakeElement(tagName, ownerDocument) };
  const content = new FakeElement('div', ownerDocument);
  renderLegacyPopupContent({
    id: 'trailhead:test',
    kind: 'trailhead',
    name: 'Fixture Park: Fixture Trailhead',
    sourceId: 'trailheads',
    description: '<img src=x onerror=alert(1)>',
    actions: [],
    properties: {},
  }, content);

  assert.deepEqual(content.children.map((child) => child.tagName), ['h3', 'h4', 'p']);
  assert.equal(content.children[2].textContent, '<img src=x onerror=alert(1)>');
  assert(!content.children.some((child) => child.tagName === 'img'));
});
