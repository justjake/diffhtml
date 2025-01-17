import { unprotectVTree } from './util/memory';
import { StateCache, NodeCache, ReleaseHookCache, Mount } from './util/types';

/**
 * Releases state and memory associated to a DOM Node.
 *
 * @param {Mount} mount - Valid input node
 */
export default function release(mount) {
  // If this was a top-level rendered element, deallocate the VTree and remove
  // the StateCache reference.
  if (StateCache.has(mount)) {
    const { mutationObserver, oldTree } = StateCache.get(mount);

    // Ensure the mutation observer is cleaned up.
    mutationObserver && mutationObserver.disconnect();

    // If there is a known root association that is not in the NodeCache,
    // remove this VTree.
    if (oldTree && !NodeCache.has(oldTree)) {
      ReleaseHookCache.forEach(fn => fn(oldTree));
      unprotectVTree(oldTree);
    }

    StateCache.delete(mount);
  }

  // The rest of this function only pertains to real HTML element nodes. If
  // this is undefined, then it isn't one.
  if (!mount) {
    return;
  }

  const asHTMLElement = /** @type {HTMLElement} */(mount);

  // Crawl the childNodes if this is an HTMLElement for state trees.
  if (asHTMLElement.childNodes && asHTMLElement.childNodes.length) {
    for (let i = 0; i < asHTMLElement.childNodes.length; i++) {
      release(asHTMLElement.childNodes[i]);
    }
  }

  // If there is a shadowRoot attached to the DOM node, attempt to release this
  // as well.
  if (asHTMLElement.shadowRoot) {
    release(asHTMLElement.shadowRoot);
  }

  // Do a thorough check within the NodeCache to fully deallocate all
  // references to the associated trees.
  NodeCache.forEach((domNode, vTree) => {
    if (domNode === asHTMLElement) {
      ReleaseHookCache.forEach(fn => fn(vTree));
      unprotectVTree(vTree);
    }
  });
}
