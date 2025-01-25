import { observer } from 'mobx-react-lite';
import { mm2px } from '@/math/svg';
import {
  DataNode,
  InternalEntry,
  InternalNode,
  LeafNode,
} from '@/plotter/rtree';
import styles from './debug.module.css';

function RTLeafNode<T extends DataNode>({ node }: { node: LeafNode<T> }) {
  return (
    <g className={styles.leafNode}>
      {node.entries.map((entry) => (
        <circle
          key={entry.id}
          className={`node-${entry.id}`}
          cx={mm2px(entry.mbr.p0[0])}
          cy={mm2px(entry.mbr.p0[1])}
          r={0.1}
        />
      ))}
    </g>
  );
}

function RTInternalNode<T extends DataNode>({
  node,
}: {
  node: InternalNode<T>;
}) {
  return (
    <g className={styles.internalNode}>
      {node.entries.map((subNode) => (
        <RTNode key={subNode.nid} node={subNode} />
      ))}
    </g>
  );
}

function RTNode<T extends DataNode>({ node }: { node: InternalEntry<T> }) {
  switch (node.type) {
    case 'rtree-type-node-internal':
      return <RTInternalNode node={node} />;
    case 'rtree-type-node-leaf':
      return <RTLeafNode node={node} />;
    default:
      return null;
  }
}

const DebugRtree = observer(function <T extends DataNode>({
  root,
  ...props
}: {
  root: InternalEntry<T> | null;
  [key: string]: unknown;
}) {
  return <g {...props}>{root && <RTNode node={root} />}</g>;
});

export default DebugRtree;
