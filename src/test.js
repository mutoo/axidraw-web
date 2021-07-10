import React from 'react';
import PropTypes from 'prop-types';
import styles from './test.css';

const Test = ({ hello }) => {
  return <div className={styles.foo}>Hello {hello}!!</div>;
};

Test.propTypes = {
  hello: PropTypes.string,
};

export default Test;
