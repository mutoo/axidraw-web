import React, { Suspense } from 'react';
import PropTypes from 'prop-types';
import Loading from 'components/loading/loading';

const App = ({ children }) => {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
};

App.propTypes = {
  children: PropTypes.node.isRequired,
};

export default App;
