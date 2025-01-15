import { describe, it, expect } from 'vitest';
import { createRTree, DataNode, LeafNode } from '../index';
import { MBR, pointAsMbr } from '../utils';

describe('rtree', () => {
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
      expect(rtree.root!.type).toBe('rtree-type-node-internal');
      expect(rtree.root!.entries.length).toBe(2);
      expect(rtree.root!.entries[0].type).toEqual('rtree-type-node-leaf');
      expect(rtree.root!.entries[0].parent).toEqual(rtree.root);
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
      expect(rtree.root!.entries.length).toBe(1);
      rtree.remove(entry.mbr, (e) => e.id === entry.id);
      expect(rtree.root).toBe(null);
    });
    it('remove nothing if node is not found', () => {
      const rtree = createRTree(2, 4);
      const entry = { id: 0, mbr: pointAsMbr([10, 10]) };
      rtree.insert(entry);
      expect(rtree.root!.entries.length).toBe(1);
      rtree.remove(entry.mbr, () => false);
      expect(rtree.root!.entries.length).toBe(1);
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
      expect(rtree.root!.type).toBe('rtree-type-node-internal');
      expect(rtree.root!.entries.length).toBe(2);
      expect(
        (rtree.root!.entries[0] as LeafNode<DataNode>).entries.length,
      ).toEqual(3);
      expect(
        (rtree.root!.entries[1] as LeafNode<DataNode>).entries.length,
      ).toEqual(2);
      rtree.remove(entries[1].mbr, (e) => e.id === entries[1].id);
      expect(rtree.root!.entries.length).toEqual(1);
      expect(
        (rtree.root!.entries[0] as LeafNode<DataNode>).entries.length,
      ).toEqual(4);
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
  });
});
