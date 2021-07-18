import React from 'react';
import styles from './footer.css';

const Footer = () => {
  return (
    <div className={styles.root}>
      <p>AxiDraw Web &copy; 2021 mutoo.im</p>
      <p>Build: {process.env.NODE_ENV}</p>
    </div>
  );
};

export default Footer;
