import classnames from 'clsx';
import { useCallback, useState } from 'react';
import type { IDeviceConnector } from '@/communication/device/device';
import DeviceConnector from '@/components/device-connector/device-connector';
import Footer from '@/components/footer/footer';
import { Button } from '@/components/ui/button';
import formStyles from '@/components/ui/form.module.css';
import sheetsStyles from '@/components/ui/sheet.module.css';
import {
  PAGE_ORIENTATION_LANDSCAPE,
  PAGE_ORIENTATION_PORTRAIT,
} from '@/containers/plotter/presenters/page';
import MidiCommander from './components/midi-commander';
import PageSetup from './components/page-setup';
import { pageSizes } from './stage';
import { trackEvent } from './utils';

enum COMPOSER_PHASE {
  SETUP,
  COMPOSING,
}

const Composer = () => {
  const [phase, setPhase] = useState(COMPOSER_PHASE.SETUP);
  const [pageSize, setPageSize] = useState(pageSizes[0]);
  const [orientation, setOrientation] = useState(PAGE_ORIENTATION_LANDSCAPE);
  const [padding, setPadding] = useState(pageSizes[0].defaultPadding);
  const [device, setDevice] = useState<IDeviceConnector<unknown> | null>(null);
  const [playing, setPlaying] = useState(false);
  const clearDevice = useCallback(() => {
    setDevice(null);
  }, []);
  const goTo = (next: COMPOSER_PHASE) => {
    setPhase(next);
    trackEvent('go to', COMPOSER_PHASE[next]);
  };

  return (
    <>
      <div className={classnames(formStyles.root, sheetsStyles.root)}>
        {phase === COMPOSER_PHASE.SETUP && (
          <PageSetup
            pageSize={pageSize}
            orientation={orientation}
            padding={padding}
            onPageSizeChange={(size) => {
              // as in the plotter, each page size comes with its own padding
              setPageSize(size);
              setPadding(size.defaultPadding);
            }}
            onOrientationChange={setOrientation}
            onPaddingChange={setPadding}
            onNext={() => {
              goTo(COMPOSER_PHASE.COMPOSING);
            }}
          />
        )}
        {/* hidden rather than unmounted, so the device stays connected */}
        <div
          className={
            phase === COMPOSER_PHASE.COMPOSING
              ? 'grid grid-cols-1 gap-6'
              : 'hidden'
          }
        >
          <div className="flex items-center justify-between gap-4">
            <p>
              <b>Page:</b> {pageSize.alias},{' '}
              {orientation === PAGE_ORIENTATION_PORTRAIT
                ? 'portrait'
                : 'landscape'}
              , {padding} mm padding
            </p>
            <Button
              variant="secondary"
              disabled={playing}
              onClick={() => {
                goTo(COMPOSER_PHASE.SETUP);
              }}
            >
              Change page
            </Button>
          </div>
          <DeviceConnector
            onConnected={setDevice}
            onDisconnected={clearDevice}
          />
          {device && (
            <MidiCommander
              device={device}
              pageSize={pageSize}
              orientation={orientation}
              padding={padding}
              playing={playing}
              setPlaying={setPlaying}
            />
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Composer;
