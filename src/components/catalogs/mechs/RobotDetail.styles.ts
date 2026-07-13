import { styled } from '@mui/material/styles';
import { DialogTitle, Chip } from '@mui/material';
import { SmartToy } from '@mui/icons-material';

export const Title = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

export const Spacer = styled('div')({
  flexGrow: 1,
});

export const IconBox = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 220,
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.action.hover,
  borderRadius: theme.shape.borderRadius,
}));

export const IconImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
});

export const IconPlaceholder = styled(SmartToy)(({ theme }) => ({
  fontSize: 132,
  color: theme.palette.action.disabled,
}));

export const ChipRow = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  flexWrap: 'wrap',
}));

export const KeyChip = styled(Chip)({
  fontFamily: 'monospace',
  cursor: 'pointer',
  transition: 'all 0.15s',
});

export const Row = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(0.5, 0),
  alignItems: 'center',
}));

export const PriceParts = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  fontSize: '0.875rem',
  fontWeight: 500,
}));

export const PriceSeparator = styled('span')(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

export const Description = styled('div')(({ theme }) => ({
  ...theme.typography.body2,
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(1),
}));
