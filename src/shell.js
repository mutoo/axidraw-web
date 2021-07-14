import React from 'react';
import ReactDOM from 'react-dom';
import App from 'containers/app/app';

// eslint-disable-next-line import/no-unresolved
import './css/index.css?global';

const shell = (Module) => {
  ReactDOM.render(
    <App>
      <Module />
    </App>,
    document.getElementById('app'),
  );
};

export default shell;
