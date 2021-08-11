// const rtree = createRTree();
// rtree.load()
// const p0node = rtree.nns(p);
// const p1node = rtree.find(p0node.p1);
// rtree.remove(p0node);
// rtree.remove(p1node);

export const RTREE_TYPE_NODE_INTERNAL = 'rtree-type-node-internal';
export const RTREE_TYPE_NODE_LEAF = 'rtree-type-node-leaf';

export const pointAsMbr = (p) => ({ p0: [...p], p1: [...p] });

export const extendMbr = (node, entryMbr) => {
  const {
    p0: [np0x, np0y],
    p1: [np1x, np1y],
  } = node.mbr;
  const {
    p0: [ep0x, ep0y],
    p1: [ep1x, ep1y],
  } = entryMbr;
  const p0x = Math.min(np0x, ep0x);
  const p0y = Math.min(np0y, ep0y);
  const p1x = Math.max(np1x, ep1x);
  const p1y = Math.min(np1y, ep1y);
  const originalArea = (np1x - np0x) * (np1y - np0y);
  const extendedArea = (p1x - p0x) * (p1y - p0y);
  const cost = extendedArea - originalArea;
  const extendedMbr = {
    p0: [p0x, p0y],
    p1: [p1x, p1y],
  };
  return {
    node,
    extendedMbr,
    extendedArea,
    originalArea,
    cost,
  };
};

export const createRTree = (minimum, nodeCapacity) => {
  // reference the root node;
  let root = null;

  const createLeafNode = (entry) => ({
    type: RTREE_TYPE_NODE_LEAF,
    entries: [entry],
    mbr: {
      ...entry.mbr,
    },
  });

  const createInternalNode = (entry) => ({
    type: RTREE_TYPE_NODE_INTERNAL,
    entries: [entry],
    mbr: {
      ...entry.mbr,
    },
  });

  const addThenSplit = (node, entry, createNodeFn) => {
    const toSplit = [...node.entries, entry].sort(
      (e0, e1) => e0.mbr.p0[0] - e1.mbr.p0[0],
    );
    const node0 = createNodeFn(toSplit[0]);
    const node1 = createNodeFn(toSplit[toSplit.length - 1]);
    const batchAddToNode = (addToNode, entries, startIdx, endIdx) => {
      for (let i = startIdx; i < endIdx; i += 1) {
        const entryToAdd = toSplit[i];
        const extended = extendMbr(addToNode, entryToAdd.mbr);
        // eslint-disable-next-line no-param-reassign
        addToNode.entries.push(entryToAdd);
        // eslint-disable-next-line no-param-reassign
        addToNode.mbr = extended.extendedMbr;
      }
    };
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
      const addToNode0 = extendMbr(node0, entryToAdd.mbr);
      const addToNode1 = extendMbr(node1, entryToAdd.mbr);
      let addToNode = addToNode1;
      if (addToNode0.cost === addToNode1.cost) {
        if (addToNode0.originalArea === addToNode1.originalArea) {
          if (node0.entries.length < node1.entries.length) {
            addToNode = addToNode0;
          }
        } else if (addToNode0.originalArea < addToNode1.originalArea) {
          addToNode = addToNode0;
        }
      } else if (addToNode0.cost < addToNode1.cost) {
        addToNode = addToNode0;
      }
      addToNode.node.entries.push(entryToAdd);
      addToNode.node.mbr = addToNode0.extendedMbr;
    }
    if (node === root) {
      root = createInternalNode(node0);
      root.entries.push(node1);
      return;
    }

    // eslint-disable-next-line consistent-return
    return [node0, node1];
  };

  const insert = (node, entry) => {
    // travers the tree from root to appropriate leaf
    if (node.type === RTREE_TYPE_NODE_INTERNAL) {
      // at each level, select the node whose node.mbr will require the minimum area
      // enlargement to cover entry.mbr
      const sortedCandidates = node.entries
        .map((subNode) => extendMbr(subNode, entry.mbr))
        .sort((n0, n1) => {
          if (n0.cost !== n1.cost) {
            return n0.cost - n1.cost;
          }
          // in case of ties, select the node whose mbr has the minimum area
          return n0.originalArea - n1.originalArea;
        });
      const chosenCandidate = sortedCandidates[0];
      const splited = insert(chosenCandidate.node, entry);
      if (!splited) {
        chosenCandidate.node.mbr = chosenCandidate.extendedMbr;
        return;
      }
      const candidateIdx = node.entries.indexOf(chosenCandidate[0]);
      node.entries.splice(candidateIdx, 1);
      node.entries.push(splited[0]);
      if (node.entries.length < nodeCapacity) {
        node.entries.push(splited[1]);
        return;
      }
      // eslint-disable-next-line consistent-return
      return addThenSplit(node, splited[1], createInternalNode);
    }
    /* node.type === RTREE_TYPE_NODE_LEAF */
    if (node.entries.length < nodeCapacity) {
      // the selected leaf can accommodate entry
      node.entries.push(entry);
      // update all mbrs in the path from L to root in the call stack;
      return;
    }
    /* the leaf is already full */
    // eslint-disable-next-line consistent-return
    return addThenSplit(node, entry, createLeafNode);
  };

  return {
    get root() {
      return root;
    },
    insert(entry) {
      if (!root) {
        root = createLeafNode(entry);
        return;
      }
      insert(root, entry);
    },
  };
};
