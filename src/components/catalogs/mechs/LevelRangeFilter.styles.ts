import { styled } from '@mui/material/styles';

export const LevelLabel = styled('span')(({ theme }) => ({
  ...theme.typography.body2,
  color: theme.palette.text.secondary,
  whiteSpace: 'nowrap',
  minWidth: 140,
  fontVariantNumeric: 'tabular-nums',
}));

export const LevelSliderWrap = styled('div')(({ theme }) => ({
  width: 340,
  paddingLeft: theme.spacing(1.5),
  paddingRight: theme.spacing(1.5),
  display: 'flex',
  alignItems: 'center',
  height: 40,
}));
