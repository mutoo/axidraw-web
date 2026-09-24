import classnames from 'clsx';
import { FileMusic } from 'lucide-react';
import type { DragEvent } from 'react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { SONG_FILE_EXTENSION } from '../song-file';

const FORMAT_URL =
  'https://github.com/mutoo/axidraw-web/blob/main/docs/composer-notation.md#song-files';

/**
 * Takes song files dropped on it, or picked with its Load button.
 */
const SongDropzone = ({
  disabled,
  onFiles,
}: {
  disabled: boolean;
  onFiles: (files: File[]) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropping, setDropping] = useState(false);
  // without this, the browser would open a dropped file in place of the page
  const hold = (e: DragEvent) => {
    e.preventDefault();
    setDropping(!disabled);
  };

  return (
    <div
      className={classnames(
        'flex flex-col items-center gap-3 rounded-md border-2 border-dashed p-4 text-center text-sm text-muted-foreground',
        dropping ? 'border-primary bg-muted' : 'border-border',
        disabled && 'opacity-50',
      )}
      onDragEnter={hold}
      onDragOver={hold}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setDropping(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDropping(false);
        if (!disabled) onFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <p>
        Drop <code>{SONG_FILE_EXTENSION}</code> files here to add them to the
        songs, or load them from your computer. A song file is{' '}
        <a
          className="underline"
          href={FORMAT_URL}
          target="_blank"
          rel="noreferrer"
        >
          plain text
        </a>
        .
      </p>
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept={SONG_FILE_EXTENSION}
        multiple
        aria-label="Song file"
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []));
          // so that the same file can be picked again
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <FileMusic className="h-4 w-4" />
        Load song
      </Button>
    </div>
  );
};

export default SongDropzone;
