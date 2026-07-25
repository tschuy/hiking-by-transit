import type { MapFeatureDetails } from '../core/types';

function appendTextElement(parent: HTMLElement, tag: 'h3' | 'h4' | 'li' | 'p', text: string): HTMLElement {
  const element = parent.ownerDocument.createElement(tag);
  element.textContent = text;
  parent.append(element);
  return element;
}

export function renderLegacyPopupContent(feature: MapFeatureDetails, content: HTMLElement): void {
  content.replaceChildren();
  if (feature.kind === 'hike') {
    appendTextElement(content, 'h3', String(feature.properties.title ?? feature.name));
    const list = content.ownerDocument.createElement('ul');
    appendTextElement(list, 'li', `Length: ${String(feature.properties.length ?? '')}`);
    appendTextElement(list, 'li', `Difficulty: ${String(feature.properties.difficultyLabel ?? feature.properties.difficultyhuman ?? '')}`);
    content.append(list);
    if (feature.description) appendTextElement(content, 'p', feature.description);
    return;
  }

  const [primaryName, secondaryName] = feature.name.split(':').map((part) => part.trim());
  appendTextElement(content, 'h3', primaryName);
  if (secondaryName) appendTextElement(content, 'h4', secondaryName);
  if (feature.description) appendTextElement(content, 'p', feature.description);
}
