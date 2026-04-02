export const toggleElementSelection = (
  selectedElements: Element[],
  element: Element,
): Element[] =>
  selectedElements.includes(element)
    ? selectedElements.filter((selectedElement) => selectedElement !== element)
    : [...selectedElements, element];
