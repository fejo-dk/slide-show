/* eslint-env browser */
import "./frame";
import "./thumbnails";
import "./counter";
import { dispatchEvent } from "uitil/dom/events";
import { find } from "uitil/dom";

class SlideShow extends HTMLElement {
  connectedCallback () {
    // NB: breaks encapsulation to avoid redundancy
    let ref = this.querySelector("slide-show-frame");
    let items = find(ref, "li");
    let item = ref.querySelector(`.${this.getAttribute("active-class")}`);

    // TODO: update cached properties when DOM changes
    let total = this.total = items.length;
    let index = this.index = items.indexOf(item);

    this.addEventListener("slide-show-cycle", this.onCycle);
    this.addEventListener("slide-show-select", this.onSelect);

    // XXX: `<slide-show-nav>` is a transitive sub-component (of `<slide-show-frame>`),
    //      taken into account here merely for convenience, to avoid repeating
    //      logic for deferred initialization
    let subComponents = ["slide-show-frame", "slide-show-thumbnails",
        "slide-show-nav", "slide-show-counter"];
    subComponents = find(this, subComponents.join(", "));
    this.initSubComponents(subComponents, { index, total });
  }

  // initialize sub-components (required to ensure consistent order of initialization)
  initSubComponents (subComponents, initialState) {
    // wait for all sub-components (i.e. custom elements) to be instantiated
    let uninitialized = subComponents.some(node => !node.initialize);
    if (uninitialized) {
      requestAnimationFrame(_ => void this.initSubComponents(subComponents, initialState));
      return;
    }

    subComponents.forEach(node => void node.initialize(initialState));
    dispatchEvent(this, "slide-show-selection", { // XXX: redundant!?
      index: initialState.index
    });
  }

  onCycle (ev) {
    ev.stopPropagation(); // contain internal event

    let { index } = this;
    if (ev.detail.direction === "next") {
      index = index === this.total - 1 ? 0 : index + 1;
    } else {
      index = index === 0 ? this.total - 1 : index - 1;
    }
    this.index = index;

    dispatchEvent(this, "slide-show-selection", { index });
  }

  onSelect (ev) {
    ev.stopPropagation(); // contain internal event

    let { index } = ev.detail;
    this.index = index;
    // NB: event name must not be identical to listener's to avoid recursion
    dispatchEvent(this, "slide-show-selection", { index });
  }
}

customElements.define("slide-show", SlideShow);
