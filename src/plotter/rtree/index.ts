import { Point2D } from '@/math/geom';

import {
  batchAddToNode,
  extendMbrPlan,
  canCoverMbr,
  mergeMbrs,
  minDist,
  minMaxDist,
  MBR,
} from './utils';

export type NodeType = 'rtree-type-node-internal' | 'rtree-type-node-leaf';

export type DataNode = {
  id: number;
  mbr: MBR;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

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
  // reference the root node;
  let root: InternalEntry<T> | null = null;
  let nodeUniqId = 0;

  const createNodeOfParent = (parent: InternalNode<T> | null, type: NodeType) =>
    function _createNode<E extends T | InternalEntry<T>>(
      ...entries: E[]
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
    createNodeFn: <E extends T | InternalEntry<T>>(
      ...entries: E[]
    ) => LeafNode<T> | InternalNode<T>,
    node: InternalNode<T> | LeafNode<T>,
  ) {
    if (node.entries.length <= nodeCapacity) {
      return;
    }
    const nodeMbr = node.mbr;
    const [cx, cy] = [
      (nodeMbr.p0[0] + nodeMbr.p1[0]) / 2,
      (nodeMbr.p0[1] + nodeMbr.p1[1]) / 2,
    ];
    const toSplit = node.entries.sort(
      (
        {
          mbr: {
            p0: [e0p0x, e0p0y],
            p1: [e0p1x, e0p1y],
          },
        },
        {
          mbr: {
            p0: [e1p0x, e1p0y],
            p1: [e1p1x, e1p1y],
          },
        },
      ) => {
        // sort by the distance too the center of the MBR
        const e0Dist = (e0p0x + e0p1x) / 2 - cx + (e0p0y + e0p1y) / 2 - cy;
        const e1Dist = (e1p0x + e1p1x) / 2 - cx + (e1p0y + e1p1y) / 2 - cy;
        return e0Dist - e1Dist;
      },
    );
    const node0 = createNodeFn(toSplit[0]);
    node0.entries[0].parent = node0;
    const node1 = createNodeFn(toSplit[toSplit.length - 1]);
    node1.entries[0].parent = node1;
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
      entryToAdd.parent = addToNodePlan.node;
      addToNodePlan.node.mbr = addToNodePlan.extendedMbr;
    }
    if (node === root) {
      root = createNodeOfParent(null, 'rtree-type-node-internal')(
        node0,
        node1,
      ) as InternalNode<T>;
      node0.parent = root;
      node1.parent = root;
      return;
    }

    return [node0, node1];
  }

  function insert(node: InternalEntry<T>, entry: T) {
    // travers the tree from root to appropriate leaf
    if (node.type === 'rtree-type-node-internal') {
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

  function reInsertEntries(node: InternalEntry<T>) {
    if (node.type === 'rtree-type-node-internal') {
      node.entries.forEach((n) => {
        reInsertEntries(n);
      });
    } else {
      node.entries.forEach((e) => {
        if (!root) {
          root = createNodeOfParent(null, 'rtree-type-node-leaf')(e);
        } else {
          insert(root, e);
        }
      });
    }
  }

  function condenseTree(node: LeafNode<T>) {
    const toReinsert: InternalEntry<T>[] = [];
    let currentNode = node as InternalEntry<T>;
    while (currentNode !== root) {
      const parent = currentNode.parent!;
      if (currentNode.entries.length < minimum) {
        const idx = parent.entries.indexOf(currentNode);
        parent.entries.splice(idx, 1);
        toReinsert.push(currentNode);
      } else {
        currentNode.mbr = mergeMbrs(currentNode.entries.map((e) => e.mbr))!;
      }
      currentNode = parent;
    }
    if (root.entries.length === 0) {
      root = null;
    }
    toReinsert.forEach((n) => {
      reInsertEntries(n);
    });
  }

  function remove(
    node: InternalEntry<T>,
    entryMbr: MBR,
    matcher: (entry: T) => boolean,
  ) {
    if (node.type === 'rtree-type-node-internal') {
      node.entries
        .filter((n) => canCoverMbr(n.mbr, entryMbr))
        .forEach((n) => {
          remove(n, entryMbr, matcher);
        });
    } else {
      const entryIdx = node.entries.findIndex(matcher);
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
      node.entries[0].type === 'rtree-type-node-internal'
    ) {
      root = node.entries[0] as InternalEntry<T>;
      root.parent = null;
    }
  }

  function nnSearch(
    node: InternalEntry<T>,
    p: Point2D,
    nearest: { distSq: number; entry: T | null },
  ) {
    if (node.type === 'rtree-type-node-leaf') {
      node.entries.forEach((entry) => {
        const [x0, y0] = p;
        const [x1, y1] = entry.mbr.p0;
        const distSq = (x0 - x1) ** 2 + (y0 - y1) ** 2;
        if (distSq < nearest.distSq) {
          nearest.distSq = distSq;
          nearest.entry = entry;
        }
      });
    } else {
      let branches = node.entries
        .map((subNode) => ({
          minDist: minDist(p, subNode.mbr),
          minMaxDist: minMaxDist(p, subNode.mbr),
          subNode,
        }))
        .sort((d0, d1) => d0.minMaxDist - d1.minMaxDist);
      // H1: an MBR M with MINDIST(P,M) grater than the MINMAXDIST(P,M0)
      // of another MBR M0, is discarded because it cannot contain the NN.
      branches = branches
        .filter((d) => d === branches[0] || d.minDist <= branches[0].minMaxDist)
        .sort((d0, d1) => d0.minDist - d1.minDist);
      for (let i = 0; i < branches.length; i += 1) {
        const branch = branches[i];
        if (branch.minDist > nearest.distSq) {
          // H3: ever MBR M with MINDIST(P, M) greater than the actual distance
          // from P to a give object O is discarded because it cannot enclose
          // an object nearer than O.
          break;
        }
        const subNode = branch.subNode;
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
        root = createNodeOfParent(
          null,
          'rtree-type-node-leaf',
        )(entry) as LeafNode<T>;
        return;
      }
      insert(root, entry);
    },
    remove(entryMbr: MBR, matcher: (entry: T) => boolean) {
      if (!root) return;
      remove(root, entryMbr, matcher);
    },
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
