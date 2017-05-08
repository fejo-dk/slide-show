/* eslint-env browser */
import "./nav";
import { selectItem } from "./util";
import { registerListeners, deregisterListeners,
    transitionEndEvents } from "utilities/events";
import { find, prependChild } from "uitil/dom";
import bindMethodContext from "uitil/method_context";

const noop = _ => {};

class SlideShowFrame extends HTMLElement {
  constructor (self) { // NB: `self` only required due to polyfill
    self = super(self);

    bindMethodContext(self, "onSelect");

    return self;
  }

  // sub-component's `connectedCallback` substitute; invoked by container component
  initialize (initialState) {
    let { root } = this;
    // TODO: update cached properties when DOM changes
    this.activeClass = root.getAttribute("active-class");
    this.dom = {
      list: this.querySelector("ol")
    };

    this.index = initialState.index;
    this.total = initialState.total;
    this.augment();
    this.selectItem();

    root.addEventListener("slide-show-selection", this.onSelect);
  }

  disconnectedCallback () {
    this.root.removeEventListener("slide-show-selection", this.onSelect);
  }

  onSelect (ev) {
    let { index } = ev.detail;
    if (index === this.index) { // no change
      return;
    }
    let previous = this.index;
    this.index = index;

    // NB: detects wrap-around at the edges
    let last = this.total - 1;
    let wrap = (index === 0 && previous === last) || (index === last && previous === 0);
    this.selectItem(wrap);
  }

  selectItem (wrap) {
    let { index, dom } = this;

    // NB: accounts for edge clones
    dom.index = index + 1;
    dom.total = this.total + 2;
    if (!wrap) {
      slide(dom);
    } else {
      // animate to clone, then immediately skip to actual element (i.e. wrapping around)
      let skip = ev => {
        deregisterListeners(dom.list, transitionEndEvents, skip);
        this.suspendAnimation();
        slide(dom);
      };
      registerListeners(dom.list, transitionEndEvents, skip);
      slide(Object.assign({}, dom, {
        index: index === 0 ? dom.total - 1 : 0
      }));
    }

    let [node, items] = selectItem(this, dom.index, this.activeClass);
    items = items.slice(1, items.length - 1); // exclude edge clones
    this.loadImages(index, node, items);
  }

  // disables sliding animation for a single cycle
  suspendAnimation () {
    let { list } = this.dom;
    list.style.transitionDuration = "1ms";
    let handler = ev => {
      list.style.transitionDuration = "";
      deregisterListeners(list, transitionEndEvents, handler);
    };
    registerListeners(list, transitionEndEvents, handler);
  }

  loadImages (index, node, items) {
    this.resolvePlaceholder(node, _ => {
      // preload neighboring images
      // TODO: debounce to account for users rapidly flicking through?
      let last = items.length - 1;
      let prev = (index === 0) ? last : (index - 1);
      let next = (index === last) ? 0 : (index + 1);
      [next, prev].forEach(index => {
        let node = items[index];
        this.resolvePlaceholder(node);
      });
    });
  }

  // resolve placeholder image, if any
  resolvePlaceholder (node, callback = noop) {
    // account for lazy images -- XXX: special-casing
    let limg = node.querySelector("lazy-img");
    if (limg) {
      let uri = limg.getAttribute("data-src");
      if (uri) {
        limg.src = uri;
      }
      return;
    }

    let img = node.querySelector("img");
    let uri = img && img.getAttribute("data-src");
    if (!uri) {
      callback();
      return;
    }
    let container = document.body;

    // preload image with hidden element
    let clone = img.cloneNode();
    clone.src = uri;
    Object.assign(clone.style, {
      position: "absolute",
      width: 0,
      height: 0,
      visibility: "hidden"
    });
    container.appendChild(clone);

    // replace placeholder with actual image when loaded
    clone.onload = ev => {
      img.src = uri;
      container.removeChild(clone);
      callback();
    };
    img.removeAttribute("data-src");
  }

  // creates a continuous horizontal band for sliding animation
  augment () {
    this.cloneEdges();

    this.suspendAnimation();
    this.dom.list.style.width = `${(this.total + 2) * 100}%`;
    this.classList.add("is-enhanced");
  }

  // duplicates first and last item
  // required for continuous, unidirectional sliding animation
  cloneEdges () {
    let { list } = this.dom;
    let items = find(list, "li");
    let first = items[0];
    let last = items[this.total - 1];

    [first, last] = [first, last].map(node => {
      let clone = node.cloneNode(true);
      clone.classList.remove(this.activeClass);
      return clone;
    });
    prependChild(last, list);
    list.appendChild(first);

    [first, last].forEach(node => this.resolvePlaceholder(node));
  }

  get root () {
    return this.closest("slide-show");
  }
}

customElements.define("slide-show-frame", SlideShowFrame);

// sliding animation
function slide ({ list, index, total }) {
  let offset = `${-100 * index / total}%`;
  let trans = `translate3d(${offset}, 0, 0)`;
  list.style.transform = trans;
  list.style["-webkit-transform"] = trans; // for compatibility with older browsers
}
