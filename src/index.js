import React from 'react';
import ReactDOM from 'react-dom';
// eslint-disable-next-line import/no-unresolved
import './css/index.css?global';
import Test from './test';

ReactDOM.render(<Test hello="react!" />, document.getElementById('app'));
