import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  createRTree,
  pointAsMbr,
  formatMbr,
  RTREE_TYPE_NODE_INTERNAL,
  RTREE_TYPE_NODE_LEAF,
} from 'plotter/rtree';
import { observer } from 'mobx-react-lite';
import PlotterContext from '../../context';
import { mm2px } from '../../../../math/svg';
import styles from './debug.css';

function LeafNode({ node }) {
  return (
    <g className={styles.leafNode}>
      {node.entries.map((entry) => (
        <circle
          key={entry.id}
          cx={mm2px(entry.mbr.p0[0])}
          cy={mm2px(entry.mbr.p0[1])}
          r={2}
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
        <TreeNode key={formatMbr(subNode.mbr)} node={subNode} />
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

const Debug = observer(({ debugRtree, ...props }) => {
  const { planning } = useContext(PlotterContext);
  const root = useMemo(() => {
    const rtree = createRTree(2, 4);
    planning.connections.forEach((line, idx) => {
      rtree.insert({ id: idx, mbr: pointAsMbr([line[0], line[1]]) });
    });
    return rtree.root;
  }, [planning.connections]);

  return <g {...props}>{debugRtree && root && <TreeNode node={root} />}</g>;
});

Debug.propTypes = {
  debugRtree: PropTypes.bool,
};

export default Debug;
