/* eslint-env browser */
import { dispatchEvent } from "uitil/dom/events";
import { Hammer } from "shims";
import bindMethodContext from "uitil/method_context";

class SlideShowNav extends HTMLElement {
  constructor (self) { // NB: `self` only required due to polyfill
    self = super(self);

    bindMethodContext(self, "onSwipe"); // required to override Hammer.js binding

    return self;
  }

  // sub-component's `connectedCallback` substitute; invoked by container component
  initialize (initialState) {
    this.addEventListener("click", this.onCycle);

    if (Hammer) { // guard against external dependency being unavailable
      let hammertime = new Hammer(this);
      hammertime.on("swipeleft swiperight", this.onSwipe);
      this.hammertime = hammertime;
    }
  }

  disconnectedCallback () {
    this.hammertime.destroy();
  }

  onSwipe (ev) {
    let direction = {
      swipeleft: "next",
      swiperight: "prev"
    }[ev.type];

    this.dispatch(direction);
  }

  onCycle (ev) {
    let node = ev.target;
    if (node.nodeName.toUpperCase() !== "A") { // event delegation
      return;
    }

    let direction = node.getAttribute("rel");
    if (direction) {
      this.dispatch(direction);
      ev.preventDefault();
    }
  }

  dispatch (direction) {
    dispatchEvent(this, "slide-show-cycle", { direction }, { bubbles: true });
  }
}

customElements.define("slide-show-nav", SlideShowNav);
