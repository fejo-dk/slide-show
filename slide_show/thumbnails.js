/* eslint-env browser */
import { selectItem } from "./util";
import { dispatchEvent } from "uitil/dom/events";
import bindMethodContext from "uitil/method_context";

class SlideShowThumbnails extends HTMLElement {
  constructor (self) { // NB: `self` only required due to polyfill
    self = super(self);

    bindMethodContext(self, "onChange");

    return self;
  }

  // sub-component's `connectedCallback` substitute; invoked by container component
  initialize (initialState) {
    let { root } = this;
    // TODO: update cached properties when DOM changes
    this.activeClass = root.getAttribute("active-class");

    this.addEventListener("click", this.onSelect);
    root.addEventListener("slide-show-selection", this.onChange);
  }

  disconnectedCallback () {
    this.root.removeEventListener("slide-show-selection", this.onChange);
  }

  onSelect (ev) {
    let node = ev.target.closest("a");
    if (!node) { // event delegation
      return;
    }
    node = node.closest("li"); // XXX: awkward

    let index = [].indexOf.call(node.parentNode.children, node);
    dispatchEvent(this, "slide-show-select", { index }, { bubbles: true });
    ev.preventDefault();
  }

  onChange (ev) {
    let { index } = ev.detail;
    if (index === this.index) { // no change
      return;
    }

    selectItem(this, index, this.activeClass);
    this.index = index;
  }

  get root () {
    return this.closest("slide-show");
  }
}

customElements.define("slide-show-thumbnails", SlideShowThumbnails);
