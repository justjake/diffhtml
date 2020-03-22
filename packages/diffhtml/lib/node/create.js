import { NodeCache, CreateNodeHookCache } from '../util/caches';
import process from '../util/process';
import globalThis from '../util/global';
import { VTreeLike } from '../util/types';
import createTree from '../tree/create';

const namespace = 'http://www.w3.org/2000/svg';
const document = /** @type {any} */ (globalThis).document || null;

/**
 * Takes in a Virtual Tree Element (VTree) and creates a DOM Node from it.
 * Sets the node into the Node cache. If this VTree already has an
 * associated node, it will reuse that.
 *
 * @param {VTreeLike} vTreeLike - A Virtual Tree Element or VTree-like element
 * @param {Document=} ownerDocument - Document to create Nodes in, defaults to document
 * @param {Boolean=} isSVG - Is their a root SVG element?
 * @return {HTMLElement | DocumentFragment} A DOM Node matching the vTree
 */
export default function createNode(vTreeLike, ownerDocument = document, isSVG) {
  if (process.env.NODE_ENV !== 'production') {
    if (!vTreeLike) {
      throw new Error('Missing VTree when trying to create DOM Node');
    }
  }

  const vTree = createTree(vTreeLike);
  const existingNode = NodeCache.get(vTree);

  // If the DOM Node was already created, reuse the existing node. This is
  // required to ensure that passed in DOM Nodes are preserved, and to ensure
  // that elements are not constantly created with the same VTree instance.
  if (existingNode) {
    return existingNode;
  }

  const {
    nodeName,
    rawNodeName = nodeName,
    childNodes = [],
  } = /** @type {any} */(vTree);

  isSVG = isSVG || nodeName === 'svg';

  // Will vary based on the properties of the VTree.
  let domNode = null;

  CreateNodeHookCache.forEach((fn, retVal) => {
    // Invoke all the `createNodeHook` functions passing along the vTree as the
    // only argument. These functions must return a valid DOM Node value.
    if (retVal = fn(vTree)) {
      domNode = retVal;
    }
  });

  if (!domNode) {
    // Create empty text elements. They will get filled in during the patch
    // process.
    if (nodeName === '#text') {
      domNode = ownerDocument.createTextNode(vTree.nodeValue || '');
    }
    // Support dynamically creating document fragments.
    else if (nodeName === '#document-fragment') {
      domNode = ownerDocument.createDocumentFragment();
    }
    // Support SVG.
    else if (isSVG) {
      domNode = ownerDocument.createElementNS(namespace, rawNodeName);
    }
    // If not a Text or SVG Node, then create with the standard method.
    else {
      domNode = ownerDocument.createElement(rawNodeName);
    }
  }

  // Add to the domNodes cache.
  NodeCache.set(vTree, domNode);

  // Append all the children into the domNode, making sure to run them
  // through this `createNode` function as well.
  for (let i = 0; i < childNodes.length; i++) {
    domNode.appendChild(createNode(childNodes[i], ownerDocument, isSVG));
  }

  return domNode;
}