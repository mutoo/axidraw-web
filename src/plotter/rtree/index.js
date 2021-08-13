// const rtree = createRTree();
// rtree.load()
// const p0node = rtree.nns(p);
// const p1node = rtree.find(p0node.p1);
// rtree.remove(p0node);
// rtree.remove(p1node);

export const RTREE_TYPE_NODE_INTERNAL = 'rtree-type-node-internal';
export const RTREE_TYPE_NODE_LEAF = 'rtree-type-node-leaf';

export const pointAsMbr = (p) => ({ p0: [...p], p1: [...p] });

export const formatMbr = ({ p0: [x0, y0], p1: [x1, y1] }) =>
  `(${x0}, ${y0}), (${x1}, ${y1})`;

export const extendMbr = (mbr0, mbr1) => {
  if (!mbr0) return mbr1;
  const {
    p0: [np0x, np0y],
    p1: [np1x, np1y],
  } = mbr0;
  const {
    p0: [ep0x, ep0y],
    p1: [ep1x, ep1y],
  } = mbr1;
  const p0x = Math.min(np0x, ep0x);
  const p0y = Math.min(np0y, ep0y);
  const p1x = Math.max(np1x, ep1x);
  const p1y = Math.max(np1y, ep1y);
  return {
    p0: [p0x, p0y],
    p1: [p1x, p1y],
  };
};

export const extendMbrPlan = (node, entryMbr) => {
  const extendedMbr = extendMbr(node.mbr, entryMbr);
  const {
    p0: [np0x, np0y],
    p1: [np1x, np1y],
  } = node.mbr;
  const {
    p0: [p0x, p0y],
    p1: [p1x, p1y],
  } = extendedMbr;
  const originalArea = (np1x - np0x) * (np1y - np0y);
  const extendedArea = (p1x - p0x) * (p1y - p0y);
  const cost = extendedArea - originalArea;
  return {
    node,
    extendedMbr,
    extendedArea,
    originalArea,
    cost,
  };
};

export const isCoverMbr = (nodeMbr, entryMbr) => {
  const {
    p0: [np0x, np0y],
    p1: [np1x, np1y],
  } = nodeMbr;
  const {
    p0: [ep0x, ep0y],
    p1: [ep1x, ep1y],
  } = entryMbr;
  return (
    np0x <= ep0x &&
    ep0x <= np1x &&
    np0x <= ep1x &&
    ep1x <= np1x &&
    np0y <= ep0y &&
    ep0y <= np1y &&
    np0y <= ep1y &&
    ep1y <= np1y
  );
};

export const mergeMbrs = (mbrs) => {
  if (!mbrs.length) return null;
  return mbrs.reduce(extendMbr);
};

export const batchAddToNode = (addToNode, entries, startIdx, endIdx) => {
  for (let i = startIdx; i < endIdx; i += 1) {
    const entryToAdd = entries[i];
    // eslint-disable-next-line no-param-reassign
    addToNode.entries.push(entryToAdd);
    entryToAdd.parent = addToNode;
    const extended = extendMbrPlan(addToNode, entryToAdd.mbr);
    // eslint-disable-next-line no-param-reassign
    addToNode.mbr = extended.extendedMbr;
  }
};

export const createRTree = (minimum, nodeCapacity) => {
  // reference the root node;
  let root = null;
  let nodeUniqId = 0;

  const createLeafNode = (parent) =>
    function _createLeafNode(...entries) {
      return {
        // eslint-disable-next-line no-plusplus
        nid: nodeUniqId++,
        type: RTREE_TYPE_NODE_LEAF,
        parent,
        entries: [...entries],
        mbr: mergeMbrs(entries.map((e) => e.mbr)),
      };
    };

  const createInternalNode = (parent) =>
    function _createInternalNode(...entries) {
      return {
        // eslint-disable-next-line no-plusplus
        nid: nodeUniqId++,
        type: RTREE_TYPE_NODE_INTERNAL,
        parent,
        entries: [...entries],
        mbr: mergeMbrs(entries.map((e) => e.mbr)),
      };
    };

  function maybeSplit(createNodeFn, node) {
    if (node.entries.length <= nodeCapacity) {
      return;
    }
    const toSplit = node.entries.sort(
      (
        {
          mbr: {
            p0: [e0p0x],
            p1: [e0p1x],
          },
        },
        {
          mbr: {
            p0: [e1p0x],
            p1: [e1p1x],
          },
        },
      ) => (e0p0x + e0p1x) / 2 - (e1p0x + e1p1x) / 2,
    );
    const node0 = createNodeFn(toSplit[0]);
    toSplit[0].parent = node0;
    const node1 = createNodeFn(toSplit[toSplit.length - 1]);
    toSplit[toSplit.length - 1].parent = node1;
    for (let i = 1; i < toSplit.length - 1; i += 1) {
      const remaining = toSplit.length - 1 - i;
      // if during the assignment of entries, there are n remain entries to be
      // assigned and the one node contains minimum - n, assign all the
      // remaining entries to this node without considering the following
      // criteria.
      if (minimum - node0.entries.length === remaining) {
        batchAddToNode(node0, toSplit, i, toSplit.length - 1);
        break;
      } else if (minimum - node1.entries.length === remaining) {
        batchAddToNode(node1, toSplit, i, toSplit.length - 1);
        break;
      }
      const entryToAdd = toSplit[i];
      const addToNodePlan0 = extendMbrPlan(node0, entryToAdd.mbr);
      const addToNodePlan1 = extendMbrPlan(node1, entryToAdd.mbr);
      let addToNodePlan = addToNodePlan1;
      if (addToNodePlan0.cost === addToNodePlan1.cost) {
        if (addToNodePlan0.originalArea === addToNodePlan1.originalArea) {
          if (node0.entries.length < node1.entries.length) {
            addToNodePlan = addToNodePlan0;
          }
        } else if (addToNodePlan0.originalArea < addToNodePlan1.originalArea) {
          addToNodePlan = addToNodePlan0;
        }
      } else if (addToNodePlan0.cost < addToNodePlan1.cost) {
        addToNodePlan = addToNodePlan0;
      }
      addToNodePlan.node.entries.push(entryToAdd);
      entryToAdd.parent = addToNodePlan.node;
      addToNodePlan.node.mbr = addToNodePlan.extendedMbr;
    }
    if (node === root) {
      root = createInternalNode(null)(node0, node1);
      node0.parent = root;
      node1.parent = root;
      return;
    }

    // eslint-disable-next-line consistent-return
    return [node0, node1];
  }

  function insert(node, entry) {
    // travers the tree from root to appropriate leaf
    if (node.type === RTREE_TYPE_NODE_INTERNAL) {
      // at each level, select the node whose node.mbr will require the minimum area
      // enlargement to cover entry.mbr
      const sortedCandidates = node.entries
        .map((subNode) => extendMbrPlan(subNode, entry.mbr))
        .sort((n0, n1) => {
          if (n0.cost !== n1.cost) {
            return n0.cost - n1.cost;
          }
          // in case of ties, select the node whose mbr has the minimum area
          return n0.originalArea - n1.originalArea;
        });
      const chosenCandidate = sortedCandidates[0];
      const split = insert(chosenCandidate.node, entry);
      if (!split) {
        chosenCandidate.node.mbr = chosenCandidate.extendedMbr;
        return;
      }
      const candidateIdx = node.entries.indexOf(chosenCandidate.node);
      node.entries.splice(candidateIdx, 1, split[0], split[1]);
      split[0].parent = node;
      split[1].parent = node;
      // eslint-disable-next-line consistent-return
      return maybeSplit(createInternalNode(node.parent), node);
    }
    /* node.type === RTREE_TYPE_NODE_LEAF */
    node.entries.push(entry);
    // eslint-disable-next-line consistent-return
    return maybeSplit(createLeafNode(node.parent), node);
  }

  function reInsertEntries(node) {
    if (node.type === RTREE_TYPE_NODE_INTERNAL) {
      node.entries.forEach((n) => {
        reInsertEntries(n);
      });
    } else {
      node.entries.forEach((e) => {
        insert(root, e);
      });
    }
  }

  function condenseTree(node) {
    const toReinsert = [];
    let currentNode = node;
    while (currentNode !== root) {
      const parent = currentNode.parent;
      if (currentNode.entries.length < minimum) {
        const idx = parent.entries.indexOf(currentNode);
        parent.entries.splice(idx, 1);
        toReinsert.push(currentNode);
      } else {
        currentNode.mbr = mergeMbrs(currentNode.entries.map((e) => e.mbr));
      }
      currentNode = parent;
    }
    if (root.entries.length === 0) {
      root = createLeafNode(null)();
    }
    toReinsert.forEach((n) => reInsertEntries(n));
  }

  function remove(node, entry) {
    if (node.type === RTREE_TYPE_NODE_INTERNAL) {
      node.entries
        .filter((n) => isCoverMbr(n.mbr, entry.mbr))
        .forEach((n) => {
          remove(n, entry);
        });
    } else {
      const entryIdx = node.entries.findIndex((e) => e.id === entry.id);
      if (entryIdx === -1) {
        // not found
        return;
      }
      node.entries.splice(entryIdx, 1);
      condenseTree(node);
    }
    if (
      node === root &&
      node.entries.length === 1 &&
      node.entries[0].type === RTREE_TYPE_NODE_INTERNAL
    ) {
      root = node.entries[0];
      root.parent = null;
    }
  }

  return {
    get root() {
      return root;
    },
    insert(entry) {
      if (!root) {
        root = createLeafNode(null)(entry);
        return;
      }
      insert(root, entry);
    },
    remove(entry) {
      if (!root) return;
      remove(root, entry);
    },
  };
};
