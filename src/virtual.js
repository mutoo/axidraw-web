import { lazy } from 'react';
import shell from 'shell';

shell(lazy(() => import('containers/virtual/virtual')));
