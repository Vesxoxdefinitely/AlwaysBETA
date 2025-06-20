import * as React from 'react';
import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

export default function PaletteIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M12 3C7.03 3 3 6.58 3 11c0 2.38 1.19 4.5 3.17 6.03.34.25.53.67.44 1.09-.13.62.36 1.18.99 1.18h6.8c.63 0 1.12-.56.99-1.18-.09-.42.1-.84.44-1.09C19.81 15.5 21 13.38 21 11c0-4.42-4.03-8-9-8zm-4 10c-.83 0-1.5-.67-1.5-1.5S7.17 10 8 10s1.5.67 1.5 1.5S8.83 13 8 13zm8 0c-.83 0-1.5-.67-1.5-1.5S15.17 10 16 10s1.5.67 1.5 1.5S16.83 13 16 13zm-4-8c.83 0 1.5.67 1.5 1.5S12.83 8 12 8s-1.5-.67-1.5-1.5S11.17 5 12 5zm0 14c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z" />
    </SvgIcon>
  );
}
