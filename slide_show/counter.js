/* eslint-env browser */
import bindMethodContext from "uitil/method_context";

class SlideShowCounter extends HTMLElement {
  constructor (self) { // NB: `self` only required due to polyfill
    self = super(self);

    this.state = {};
    bindMethodContext(self, "onSelect");

    return self;
  }

  // sub-component's `connectedCallback` substitute; invoked by container component
  initialize (initialState) {
    this.state = initialState;
    this.update();

    this.root.addEventListener("slide-show-selection", this.onSelect);
  }

  disconnectedCallback () {
    this.root.removeEventListener("slide-show-selection", this.onSelect);
  }

  onSelect (ev) {
    this.state.index = ev.detail.index;
    this.update();
  }

  update() {
    let { index, total } = this.state;
    this.textContent = this.format.
      replace("{index}", index + 1).
      replace("{total}", total);
  }

  get format() {
    return this.getAttribute("format");
  }

  get root () {
    return this.closest("slide-show");
  }
}

customElements.define("slide-show-counter", SlideShowCounter);
