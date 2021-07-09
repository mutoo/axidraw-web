import React from 'react';
import PropTypes from 'prop-types';

const Test = ({ hello }) => {
  return <div>Hello {hello}!</div>;
};

Test.propTypes = {
  hello: PropTypes.string,
};

export default Test;
