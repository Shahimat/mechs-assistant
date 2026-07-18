import { styled } from '@mui/material/styles';
import { DialogTitle, Chip } from '@mui/material';
import { Category } from '@mui/icons-material';

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
  height: 260,
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.action.hover,
  borderRadius: theme.shape.borderRadius,
}));

export const IconImage = styled('img')({
  width: '85%',
  height: '85%',
  objectFit: 'contain',
});

export const IconPlaceholder = styled(Category)(({ theme }) => ({
  fontSize: 160,
  color: theme.palette.action.disabled,
}));

export const ChipRow = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  flexWrap: 'wrap',
}));

export const KeyChip = styled(Chip)({
  cursor: 'pointer',
  fontFamily: 'monospace',
});

export const Row = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
  gap: theme.spacing(1),
}));

export const PriceParts = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
}));

export const PriceSeparator = styled('span')(({ theme }) => ({
  color: theme.palette.text.disabled,
}));

export const Description = styled('p')(({ theme }) => ({
  ...theme.typography.body2,
  color: theme.palette.text.secondary,
  margin: 0,
  whiteSpace: 'pre-wrap',
}));

export const DropList = styled('div')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(0.75),
  marginTop: theme.spacing(0.5),
  marginBottom: theme.spacing(1),
}));

export const DropLabel = styled('div')(({ theme }) => ({
  ...theme.typography.body2,
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(1),
}));
