export function selectItem (container, index, activeClass) {
  let node = container.querySelector(`.${activeClass}`);
  if (!node) {
    return;
  }
  let items = [...node.parentNode.children];

  node.classList.remove(activeClass);
  node = items[index];
  node.classList.add(activeClass);

  return [node, items];
}
