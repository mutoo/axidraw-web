import { createRTree } from '../index';
import { RTREE_TYPE_NODE_INTERNAL, RTREE_TYPE_NODE_LEAF } from '../consts';
import { pointAsMbr } from '../utils';

describe('rtree', () => {
  describe('insert', () => {
    it('insert first entry at root', () => {
      const entry = { id: 0, mbr: pointAsMbr([10, 10]) };
      const rtree = createRTree(2, 4);
      rtree.insert(entry);
      expect(rtree.root.type).toBe(RTREE_TYPE_NODE_LEAF);
      expect(rtree.root.parent).toBe(null);
      expect(rtree.root.entries.length).toBe(1);
      expect(rtree.root.entries[0]).toEqual(entry);
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
      expect(rtree.root.type).toBe(RTREE_TYPE_NODE_INTERNAL);
      expect(rtree.root.entries.length).toBe(2);
      expect(rtree.root.entries[0].type).toEqual(RTREE_TYPE_NODE_LEAF);
      expect(rtree.root.entries[0].parent).toEqual(rtree.root);
    });
    it('insert 10000 random points', () => {
      const rtree = createRTree(2, 4);
      expect(() => {
        for (let i = 0; i < 10000; i += 1) {
          const x = (Math.random() * 512) | 0;
          const y = (Math.random() * 512) | 0;
          rtree.insert({
            id: i,
            mbr: pointAsMbr([x, y]),
          });
        }
      }).not.toThrow();
    });
  });

  describe('remove', () => {
    it('remove node in root', () => {
      const rtree = createRTree(2, 4);
      const entry = { id: 0, mbr: pointAsMbr([10, 10]) };
      rtree.insert(entry);
      expect(rtree.root.entries.length).toBe(1);
      rtree.remove({ id: 0 });
      expect(rtree.root.type).toBe(RTREE_TYPE_NODE_LEAF);
    });
    it('remove nothing if node is not found', () => {
      const rtree = createRTree(2, 4);
      const entry = { id: 0, mbr: pointAsMbr([10, 10]) };
      rtree.insert(entry);
      expect(rtree.root.entries.length).toBe(1);
      rtree.remove(entry);
      expect(rtree.root.entries.length).toBe(0);
    });
    it('condense tree after remove', () => {
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
      expect(rtree.root.type).toBe(RTREE_TYPE_NODE_INTERNAL);
      expect(rtree.root.entries.length).toBe(2);
      expect(rtree.root.entries[0].entries.length).toEqual(3);
      expect(rtree.root.entries[1].entries.length).toEqual(2);
      rtree.remove(entries[1]);
      expect(rtree.root.entries.length).toEqual(1);
      expect(rtree.root.entries[0].entries.length).toEqual(4);
    });
  });
});
