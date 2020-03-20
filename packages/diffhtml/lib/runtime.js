import createTree from './tree/create';
import syncTree from './tree/sync';
import createNode from './node/create';
import internals from './util/internals';
import { PATCH_TYPE } from './util/types';
import globalThis from './util/global';
import innerHTML from './inner-html';
import outerHTML from './outer-html';
import { defaultTasks, tasks } from './transaction';
import release from './release';
import use from './use';
import { addTransitionState, removeTransitionState } from './transition';
import { __VERSION__ } from './version';

const { assign } = Object;
const VERSION = `${__VERSION__}-runtime`;

// This is an internal API exported purely for middleware and extensions to
// leverage internal APIs that are not part of the public API. There are no
// promises that this will not break in the future. We will attempt to minimize
// changes and will supply fallbacks when APIs change.
const Internals = assign(internals, {
  defaultTasks,
  tasks,
  createNode,
  syncTree,
  PATCH_TYPE,
});

api.VERSION = VERSION;
api.addTransitionState = addTransitionState;
api.removeTransitionState = removeTransitionState;
api.release = release;
api.createTree = createTree;
api.use = use;
api.outerHTML = outerHTML;
api.innerHTML = innerHTML;
api.html = createTree;

// Attach a circular reference to `Internals` for ES/CJS builds.
api.Internals = Internals;

/** @type {any} */
const global = globalThis;

// Automatically hook up to DevTools if they are present.
if (global.devTools) {
  use(global.devTools(Internals));
  console.warn('diffHTML DevTools: Found and activated!');
}

export {
  VERSION,
  addTransitionState,
  removeTransitionState,
  release,
  createTree,
  use,
  outerHTML,
  innerHTML,
  createTree as html,
  Internals,
};

export default api;
