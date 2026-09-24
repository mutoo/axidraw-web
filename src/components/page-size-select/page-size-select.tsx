import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import type { PageSize } from '@/plotter/page-sizes';
import {
  findPageSize,
  pageSizeGroups,
  pageSizeLabel,
} from '@/plotter/page-sizes';

// the page size picker every app shares, the sizes grouped by kind
const PageSizeSelect = ({
  value,
  onChange,
  className,
  ...props
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> & {
  // the id of the size picked
  value: string;
  onChange: (size: PageSize) => void;
}) => (
  <select
    // the longest name mustn't push the select out of its box
    className={cn('max-w-full min-w-0', className)}
    value={value}
    onChange={(e) => {
      onChange(findPageSize(e.target.value));
    }}
    {...props}
  >
    {pageSizeGroups.map(({ name, sizes }) => (
      <optgroup key={name} label={name}>
        {sizes.map((size) => (
          <option key={size.id} value={size.id}>
            {pageSizeLabel(size)}
          </option>
        ))}
      </optgroup>
    ))}
  </select>
);

export default PageSizeSelect;
