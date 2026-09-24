import { describe, it, expect } from 'vitest';
import type { Point2D } from '@/math/geom';
import type { DataNode, InternalEntry, InternalNode, LeafNode } from '../index';
import { createRTree } from '../index';
import type { MBR } from '../utils';
import { mergeMbrs, pointAsMbr } from '../utils';

const countEntries = (node: InternalEntry<DataNode> | null): number => {
  if (!node) return 0;
  if (node.type === 'rtree-type-node-leaf') return node.entries.length;
  return node.entries.reduce((n, child) => n + countEntries(child), 0);
};

// seeded pseudo-random numbers in [0, 1), so that failures reproduce
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// what's wrong with the tree's structure, and the ids of its entries
const checkTree = (
  root: InternalEntry<DataNode> | null,
  nodeCapacity: number,
) => {
  const problems: string[] = [];
  const ids: number[] = [];
  const leafDepths = new Set<number>();
  const walk = (node: InternalEntry<DataNode>, depth: number) => {
    const size = node.entries.length;
    if (size === 0 || size > nodeCapacity) {
      problems.push(`node ${node.nid} has ${size} entries`);
    }
    const mbr = mergeMbrs(node.entries.map((e) => e.mbr));
    if (JSON.stringify(mbr) !== JSON.stringify(node.mbr)) {
      problems.push(`node ${node.nid} has a loose MBR`);
    }
    if (node.type === 'rtree-type-node-leaf') {
      leafDepths.add(depth);
      ids.push(...node.entries.map((e) => e.id));
      return;
    }
    for (const child of node.entries) {
      if (child.parent !== node) {
        problems.push(`node ${child.nid} has a wrong parent`);
      }
      walk(child, depth + 1);
    }
  };
  if (root) {
    if (root.parent !== null) problems.push('the root has a parent');
    if (root.type === 'rtree-type-node-internal' && root.entries.length < 2) {
      problems.push('the root has a single child');
    }
    walk(root, 0);
  }
  if (leafDepths.size > 1) problems.push('leaves at different depths');
  return { problems, ids: ids.sort((a, b) => a - b) };
};

// the nearest entry to p (the smallest id of the equally near ones)
const linearNearest = (entries: Map<number, DataNode>, [x, y]: Point2D) => {
  let nearest: DataNode | null = null;
  let nearestDistSq = Infinity;
  for (const entry of entries.values()) {
    const [ex, ey] = entry.mbr.p0;
    const distSq = (x - ex) ** 2 + (y - ey) ** 2;
    if (
      distSq < nearestDistSq ||
      (distSq === nearestDistSq && entry.id < nearest!.id)
    ) {
      nearest = entry;
      nearestDistSq = distSq;
    }
  }
  return nearest;
};

describe('rtree', () => {
  it('rejects a minimum that a split cannot satisfy', () => {
    expect(() => createRTree(0, 4)).toThrow();
    expect(() => createRTree(3, 4)).toThrow();
    expect(() => createRTree(1, 1)).toThrow();
    expect(() => createRTree(3, 5)).not.toThrow();
  });

  describe('insert', () => {
    it('insert first entry at root', () => {
      const entry = { id: 0, mbr: pointAsMbr([10, 10]) };
      const rtree = createRTree(2, 4);
      rtree.insert(entry);
      expect(rtree.root!.type).toBe('rtree-type-node-leaf');
      expect(rtree.root!.parent).toBe(null);
      expect(rtree.root!.entries.length).toBe(1);
      expect(rtree.root!.entries[0]).toEqual(entry);
    });
    it('split root when full', () => {
      const entries = [
        { id: 0, mbr: pointAsMbr([10, 10]) },
        { id: 1, mbr: pointAsMbr([13, 13]) },
        { id: 2, mbr: pointAsMbr([14, 14]) },
        { id: 3, mbr: pointAsMbr([12, 12]) },
        { id: 4, mbr: pointAsMbr([11, 11]) },
      ];
      const rtree = createRTree(2, 4);
      for (const entry of entries) {
        rtree.insert(entry);
      }
      const root = rtree.root as InternalNode<DataNode>;
      expect(root.type).toBe('rtree-type-node-internal');
      expect(root.entries.length).toBe(2);
      expect(root.entries[0].type).toEqual('rtree-type-node-leaf');
      expect(root.entries[0].parent).toEqual(root);
    });
    it('leaves the entries as they are', () => {
      const entries = Array.from({ length: 100 }, (_, id) => ({
        id,
        mbr: pointAsMbr([(id * 37) % 100, (id * 61) % 100]),
      }));
      const rtree = createRTree(2, 4);
      for (const entry of entries) {
        rtree.insert(entry);
      }
      for (const entry of entries) {
        expect(Object.keys(entry)).toEqual(['id', 'mbr']);
      }
    });
    it('keeps the MBR of the root tight', () => {
      const entries = Array.from({ length: 100 }, (_, id) => ({
        id,
        mbr: pointAsMbr([(id * 37) % 100, (id * 61) % 100]),
      }));
      const rtree = createRTree(2, 4);
      entries.forEach((entry, i) => {
        rtree.insert(entry);
        expect(rtree.root!.mbr).toEqual(
          mergeMbrs(entries.slice(0, i + 1).map((e) => e.mbr)),
        );
      });
    });
    it('insert 10000 random points', () => {
      const random = mulberry32(1);
      const rtree = createRTree(2, 4);
      for (let i = 0; i < 10000; i += 1) {
        const x = (random() * 512) | 0;
        const y = (random() * 512) | 0;
        rtree.insert({
          id: i,
          mbr: pointAsMbr([x, y]),
        });
      }
      const { problems, ids } = checkTree(rtree.root, 4);
      expect(problems).toEqual([]);
      expect(ids).toEqual(Array.from({ length: 10000 }, (_, i) => i));
    });
  });

  describe('remove', () => {
    it('remove node in root', () => {
      const rtree = createRTree(2, 4);
      const entry = { id: 0, mbr: pointAsMbr([10, 10]) };
      rtree.insert(entry);
      expect(rtree.root!.entries.length).toBe(1);
      rtree.remove(entry.mbr, (e) => e.id === entry.id);
      expect(rtree.root).toBe(null);
    });
    it('remove nothing if node is not found', () => {
      const rtree = createRTree(2, 4);
      const entry = { id: 0, mbr: pointAsMbr([10, 10]) };
      rtree.insert(entry);
      expect(rtree.root!.entries.length).toBe(1);
      expect(rtree.remove(entry.mbr, () => false)).toBe(false);
      expect(rtree.root!.entries.length).toBe(1);
    });
    it('removes one matching entry per call', () => {
      const rtree = createRTree(2, 4);
      const mbr = pointAsMbr([10, 10]);
      for (let id = 1; id <= 20; id += 1) {
        rtree.insert({ id, mbr: pointAsMbr([10, 10]) });
      }
      for (let left = 20; left > 0; left -= 1) {
        expect(countEntries(rtree.root)).toBe(left);
        expect(rtree.remove(mbr, () => true)).toBe(true);
      }
      expect(rtree.root).toBe(null);
      expect(rtree.remove(mbr, () => true)).toBe(false);
    });
    it('drops emptied nodes and shortens the tree after remove', () => {
      const entries = [
        { id: 0, mbr: pointAsMbr([10, 10]) },
        { id: 1, mbr: pointAsMbr([13, 13]) },
        { id: 2, mbr: pointAsMbr([14, 14]) },
        { id: 3, mbr: pointAsMbr([12, 12]) },
        { id: 4, mbr: pointAsMbr([11, 11]) },
      ];
      const rtree = createRTree(2, 4);
      for (const entry of entries) {
        rtree.insert(entry);
      }
      expect(rtree.root!.type).toBe('rtree-type-node-internal');
      expect(rtree.root!.entries.length).toBe(2);
      expect(
        (rtree.root!.entries[0] as LeafNode<DataNode>).entries.length,
      ).toEqual(3);
      expect(
        (rtree.root!.entries[1] as LeafNode<DataNode>).entries.length,
      ).toEqual(2);
      // an underfull leaf is kept, just with a smaller MBR
      rtree.remove(entries[1].mbr, (e) => e.id === entries[1].id);
      expect(rtree.root!.entries.length).toEqual(2);
      expect(
        (rtree.root!.entries[1] as LeafNode<DataNode>).entries.length,
      ).toEqual(1);
      expect(rtree.root!.entries[1].mbr).toEqual(pointAsMbr([14, 14]));
      // an emptied leaf is dropped, and the root's only child replaces it
      rtree.remove(entries[2].mbr, (e) => e.id === entries[2].id);
      expect(rtree.root!.type).toBe('rtree-type-node-leaf');
      expect(rtree.root!.parent).toBe(null);
      expect(rtree.root!.entries.length).toEqual(3);
      expect(rtree.root!.mbr).toEqual({ p0: [10, 10], p1: [12, 12] });
    });
  });

  describe('nn search', () => {
    it('returns null when tree is empty', () => {
      const rtree = createRTree(2, 4);
      expect(rtree.nnSearch([0, 0], () => true)).toBe(null);
    });

    it('returns id of near point', () => {
      type entry = { id: number; mbr: MBR };
      const entries: entry[] = [
        { id: 0, mbr: pointAsMbr([10, 10]) },
        { id: 1, mbr: pointAsMbr([13, 13]) },
        { id: 2, mbr: pointAsMbr([14, 14]) },
        { id: 3, mbr: pointAsMbr([12, 12]) },
        { id: 4, mbr: pointAsMbr([11, 11]) },
      ];
      const rtree = createRTree<entry>(2, 4);
      for (const entry of entries) {
        rtree.insert(entry);
      }

      const extractId = (e: entry) => e.id;
      expect(rtree.nnSearch([9, 9], extractId)).toBe(0);
      expect(rtree.nnSearch([10, 10], extractId)).toBe(0);
      expect(rtree.nnSearch([13, 13], extractId)).toBe(1);
      expect(rtree.nnSearch([14, 14], extractId)).toBe(2);
      expect(rtree.nnSearch([12, 12], extractId)).toBe(3);
      expect(rtree.nnSearch([15, 15], extractId)).toBe(2);
    });

    it('measures the distance to the whole MBR of an entry', () => {
      const rtree = createRTree(2, 4);
      rtree.insert({ id: 1, mbr: { p0: [0, 0], p1: [10, 10] } });
      rtree.insert({ id: 2, mbr: pointAsMbr([14, 14]) });
      // inside the rectangle, but far from its corner p0
      expect(rtree.nnSearch([9, 9], (e) => e.id)).toBe(1);
      expect(rtree.nnSearch([15, 15], (e) => e.id)).toBe(2);
    });

    it('returns the smallest id among equally near entries', () => {
      // the 12 integer points 5 away from the origin, 5 copies of each, with
      // scrambled ids so that equally near entries spread over many leaves
      const ring: Point2D[] = [
        [3, 4],
        [4, 3],
        [5, 0],
        [4, -3],
        [3, -4],
        [0, -5],
        [-3, -4],
        [-4, -3],
        [-5, 0],
        [-4, 3],
        [-3, 4],
        [0, 5],
      ];
      const n = ring.length * 5;
      const rtree = createRTree(2, 4);
      for (let i = 0; i < n; i += 1) {
        rtree.insert({
          id: ((i * 37) % n) + 1,
          mbr: pointAsMbr(ring[i % ring.length]),
        });
      }
      for (let id = 1; id <= n; id += 1) {
        const entry = rtree.nnSearch([0, 0], (e) => e);
        expect(entry!.id).toBe(id);
        rtree.remove(entry!.mbr, (e) => e.id === id);
      }
      expect(rtree.root).toBe(null);
    });
  });

  describe('random operations', () => {
    const layouts: [string, (random: () => number) => Point2D][] = [
      ['scattered points', (random) => [random() * 300, random() * 200]],
      // many duplicates and equally near points
      [
        'points on a small grid',
        (random) => [(random() * 30) | 0, (random() * 30) | 0],
      ],
      // MBRs with no width
      ['points on a line', (random) => [5, (random() * 400) | 0]],
    ];
    const params: [minimum: number, nodeCapacity: number][] = [
      [2, 4],
      [4, 9],
    ];
    for (const [layout, randomPoint] of layouts) {
      for (const [minimum, nodeCapacity] of params) {
        it(`matches a linear scan: ${layout}, ${minimum}/${nodeCapacity}`, () => {
          const random = mulberry32(minimum * 100 + nodeCapacity);
          const rtree = createRTree(minimum, nodeCapacity);
          const entries = new Map<number, DataNode>();
          const expectValidTree = () => {
            const { problems, ids } = checkTree(rtree.root, nodeCapacity);
            expect(problems).toEqual([]);
            expect(ids).toEqual([...entries.keys()].sort((a, b) => a - b));
          };
          let nextId = 1;
          for (let step = 0; step < 3000; step += 1) {
            const op = random();
            if (op < 0.5 || entries.size < 5) {
              const entry = {
                id: nextId,
                mbr: pointAsMbr(randomPoint(random)),
              };
              nextId += 1;
              rtree.insert(entry);
              entries.set(entry.id, entry);
            } else if (op < 0.8) {
              const ids = [...entries.keys()];
              const entry = entries.get(ids[(random() * ids.length) | 0])!;
              expect(rtree.remove(entry.mbr, (e) => e.id === entry.id)).toBe(
                true,
              );
              entries.delete(entry.id);
            } else {
              const p: Point2D = [
                ((random() * 350) | 0) - 25,
                ((random() * 450) | 0) - 25,
              ];
              expect(rtree.nnSearch(p, (e) => e.id)).toBe(
                linearNearest(entries, p)!.id,
              );
            }
            if (step % 10 === 0) expectValidTree();
          }
          expectValidTree();
          // then empty it the way the planner does
          let p: Point2D = [0, 0];
          while (entries.size) {
            const entry = rtree.nnSearch(p, (e) => e)!;
            expect(entry.id).toBe(linearNearest(entries, p)!.id);
            rtree.remove(entry.mbr, (e) => e.id === entry.id);
            entries.delete(entry.id);
            p = entry.mbr.p0;
            if (entries.size % 10 === 0) expectValidTree();
          }
          expect(rtree.root).toBe(null);
        });
      }
    }
  });
});
