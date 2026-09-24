import type { Point2D } from '@/math/geom';

import type { MBR } from './utils';
import {
  batchAddToNode,
  extendMbr,
  extendMbrPlan,
  canCoverMbr,
  mergeMbrs,
  minDist,
} from './utils';

export type NodeType = 'rtree-type-node-internal' | 'rtree-type-node-leaf';

export type DataNode = {
  id: number;
  mbr: MBR;
};

// x + y of an MBR's centre, doubled
const diagonalKey = ({ p0, p1 }: MBR) => p0[0] + p1[0] + p0[1] + p1[1];

export type CommonNode = {
  nid: number;
  mbr: MBR;
};

export type InternalNode<T extends DataNode> = CommonNode & {
  type: 'rtree-type-node-internal';
  parent: InternalNode<T> | null;
  entries: InternalEntry<T>[];
};

export type LeafNode<T extends DataNode> = CommonNode & {
  type: 'rtree-type-node-leaf';
  parent: InternalNode<T> | null;
  entries: T[];
};

export type InternalEntry<T extends DataNode> = InternalNode<T> | LeafNode<T>;

export const createRTree = <T extends DataNode>(
  minimum: number,
  nodeCapacity: number,
) => {
  // a split shares nodeCapacity + 1 entries between two nodes that each need
  // at least `minimum`
  if (minimum < 1 || nodeCapacity < 2 || minimum * 2 > nodeCapacity + 1) {
    throw new Error(
      `rtree: minimum ${minimum} doesn't fit node capacity ${nodeCapacity}`,
    );
  }
  // reference the root node;
  let root: InternalEntry<T> | null = null;
  let nodeUniqId = 0;

  const createNodeOfParent = (parent: InternalNode<T> | null, type: NodeType) =>
    function _createNode(
      ...entries: (T | InternalEntry<T>)[]
    ): InternalNode<T> | LeafNode<T> {
      if (type === 'rtree-type-node-internal') {
        return {
          nid: nodeUniqId++,
          type,
          parent,
          entries: [...(entries as InternalNode<T>[])],
          mbr: mergeMbrs(entries.map((e) => e.mbr))!,
        };
      }
      return {
        nid: nodeUniqId++,
        type,
        parent,
        entries: [...(entries as T[])],
        mbr: mergeMbrs(entries.map((e) => e.mbr))!,
      };
    };

  function maybeSplit(
    createNodeFn: (
      ...entries: (T | InternalEntry<T>)[]
    ) => LeafNode<T> | InternalNode<T>,
    node: InternalNode<T> | LeafNode<T>,
  ) {
    if (node.entries.length <= nodeCapacity) {
      return;
    }
    // sort along the diagonal, by x + y of the entries' centres, and seed
    // the two new nodes with the entries at either end
    const toSplit = node.entries.sort(
      (e0, e1) => diagonalKey(e0.mbr) - diagonalKey(e1.mbr),
    );
    const node0 = createNodeFn(toSplit[0]);
    const node1 = createNodeFn(toSplit[toSplit.length - 1]);
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
      const addToNodePlan0 = extendMbrPlan<T>(node0, entryToAdd.mbr);
      const addToNodePlan1 = extendMbrPlan<T>(node1, entryToAdd.mbr);
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
      (addToNodePlan.node.entries as (T | InternalEntry<T>)[]).push(entryToAdd);
      addToNodePlan.node.mbr = addToNodePlan.extendedMbr;
    }
    // child nodes move to their new parents; data entries don't track theirs
    for (const half of [node0, node1]) {
      if (half.type === 'rtree-type-node-internal') {
        for (const child of half.entries) {
          child.parent = half;
        }
      }
    }
    if (node === root) {
      const newRoot = createNodeOfParent(null, 'rtree-type-node-internal')(
        node0,
        node1,
      ) as InternalNode<T>;
      root = newRoot;
      node0.parent = newRoot;
      node1.parent = newRoot;
      return;
    }

    return [node0, node1];
  }

  function insert(node: InternalEntry<T>, entry: T) {
    // travers the tree from root to appropriate leaf
    if (node.type === 'rtree-type-node-internal') {
      // at each level, select the node whose node.mbr will require the
      // minimum area enlargement to cover entry.mbr; in case of ties, the
      // node whose mbr has the minimum area
      let chosenCandidate = extendMbrPlan(node.entries[0], entry.mbr);
      for (let i = 1; i < node.entries.length; i += 1) {
        const candidate = extendMbrPlan(node.entries[i], entry.mbr);
        if (
          candidate.cost < chosenCandidate.cost ||
          (candidate.cost === chosenCandidate.cost &&
            candidate.originalArea < chosenCandidate.originalArea)
        ) {
          chosenCandidate = candidate;
        }
      }
      const split = insert(chosenCandidate.node, entry);
      if (!split) {
        chosenCandidate.node.mbr = chosenCandidate.extendedMbr;
        return;
      }
      const candidateIdx = node.entries.indexOf(chosenCandidate.node);
      node.entries.splice(candidateIdx, 1, split[0], split[1]);
      split[0].parent = node;
      split[1].parent = node;
      return maybeSplit(
        createNodeOfParent(node.parent, 'rtree-type-node-internal'),
        node,
      );
    }
    /* node.type === RTREE_TYPE_NODE_LEAF */
    node.entries.push(entry);
    return maybeSplit(
      createNodeOfParent(node.parent, 'rtree-type-node-leaf'),
      node,
    );
  }

  // After an entry is removed from `leaf`, drop the nodes it left empty and
  // shrink the MBRs up to the root. Unlike Guttman's R-tree, an underfull
  // node is kept rather than having its entries inserted again: the planner
  // empties the tree point by point, and re-inserting rebuilt whole subtrees
  // over and over.
  function condenseTree(leaf: LeafNode<T>) {
    let node: InternalEntry<T> = leaf;
    while (node.parent) {
      const parent: InternalNode<T> = node.parent;
      if (node.entries.length === 0) {
        parent.entries.splice(parent.entries.indexOf(node), 1);
      } else {
        node.mbr = mergeMbrs(node.entries.map((e) => e.mbr))!;
      }
      node = parent;
    }
    // node is the root now
    if (node.entries.length === 0) {
      root = null;
      return;
    }
    node.mbr = mergeMbrs(node.entries.map((e) => e.mbr))!;
    // a root with a single child is replaced by that child
    while (
      node.type === 'rtree-type-node-internal' &&
      node.entries.length === 1
    ) {
      node = node.entries[0];
    }
    node.parent = null;
    root = node;
  }

  // the first leaf holding an entry that matcher accepts, and its index there
  function findLeaf(
    node: InternalEntry<T>,
    entryMbr: MBR,
    matcher: (entry: T) => boolean,
  ): { leaf: LeafNode<T>; idx: number } | null {
    if (node.type === 'rtree-type-node-leaf') {
      const idx = node.entries.findIndex(matcher);
      return idx === -1 ? null : { leaf: node, idx };
    }
    for (const subNode of node.entries) {
      if (canCoverMbr(subNode.mbr, entryMbr)) {
        const found = findLeaf(subNode, entryMbr, matcher);
        if (found) return found;
      }
    }
    return null;
  }

  // Branch and bound as in Roussopoulos et al. (1995), without their
  // MINMAXDIST pruning: when branches are visited in MINDIST order, pruning
  // those farther than the best entry so far already drops all it would
  // (Cheung and Fu, 1998).
  function nnSearch(
    node: InternalEntry<T>,
    p: Point2D,
    nearest: { distSq: number; entry: T | null },
  ) {
    if (node.type === 'rtree-type-node-leaf') {
      node.entries.forEach((entry) => {
        const distSq = minDist(p, entry.mbr);
        // among equally near entries take the smallest id, so the result
        // doesn't depend on how the tree happens to be split
        if (
          distSq < nearest.distSq ||
          (distSq === nearest.distSq &&
            nearest.entry !== null &&
            entry.id < nearest.entry.id)
        ) {
          nearest.distSq = distSq;
          nearest.entry = entry;
        }
      });
    } else {
      const branches = node.entries
        .map((subNode) => ({ distSq: minDist(p, subNode.mbr), subNode }))
        .sort((b0, b1) => b0.distSq - b1.distSq);
      for (const { distSq, subNode } of branches) {
        // a branch exactly as far as the best entry may still hold an
        // equally near one with a smaller id
        if (distSq > nearest.distSq) break;
        nnSearch(subNode, p, nearest);
      }
    }
  }

  return {
    get root() {
      return root;
    },
    insert(entry: T) {
      if (!root) {
        root = createNodeOfParent(null, 'rtree-type-node-leaf')(entry);
        return;
      }
      const oldRoot = root;
      insert(root, entry);
      // insert() updates the MBRs below the root, and a new root gets its
      // MBR when it's created
      if (root === oldRoot) {
        root.mbr = extendMbr(root.mbr, entry.mbr);
      }
    },
    // removes one entry that matcher accepts, searching where entryMbr lies;
    // returns whether there was one
    remove(entryMbr: MBR, matcher: (entry: T) => boolean): boolean {
      if (!root) return false;
      const found = findLeaf(root, entryMbr, matcher);
      if (!found) return false;
      found.leaf.entries.splice(found.idx, 1);
      condenseTree(found.leaf);
      return true;
    },
    // the entry nearest to p; of equally near entries, the one with the
    // smallest id
    nnSearch<R>(p: Point2D, extract: (e: T) => R): R | null {
      if (!root) return null;
      const result: {
        distSq: number;
        entry: T | null;
      } = { distSq: Number.MAX_VALUE, entry: null };
      nnSearch(root, p, result);
      return extract(result.entry!);
    },
  };
};
