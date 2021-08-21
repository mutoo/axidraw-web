import React from 'react';
import PropTypes from 'prop-types';
import {
  RTREE_TYPE_NODE_INTERNAL,
  RTREE_TYPE_NODE_LEAF,
} from 'plotter/rtree/consts';
import { observer } from 'mobx-react-lite';
import { mm2px } from '../../../../math/svg';
import styles from './debug.css';

function LeafNode({ node }) {
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

LeafNode.propTypes = {
  node: PropTypes.object,
};

function InternalNode({ node }) {
  return (
    <g className={styles.internalNode}>
      {node.entries.map((subNode) => (
        <TreeNode key={subNode.nid} node={subNode} />
      ))}
    </g>
  );
}

InternalNode.propTypes = {
  node: PropTypes.object,
};

function TreeNode({ node }) {
  switch (node.type) {
    case RTREE_TYPE_NODE_INTERNAL:
      return <InternalNode node={node} />;
    case RTREE_TYPE_NODE_LEAF:
      return <LeafNode node={node} />;
    default:
      return null;
  }
}

TreeNode.propTypes = {
  node: PropTypes.object,
};

const DebugRtree = observer(({ root, ...props }) => {
  return <g {...props}>{root && <TreeNode node={root} />}</g>;
});

DebugRtree.propTypes = {
  root: PropTypes.object,
};

export default DebugRtree;
