import { styled } from '@mui/material/styles';
import { CardActionArea, Card } from '@mui/material';

export const CardRoot = styled(Card)(({ theme }) => ({
  width: 72,
  flex: '0 0 auto',
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius,
}));

export const CardBody = styled(CardActionArea)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  padding: theme.spacing(0.5),
  gap: theme.spacing(0.25),
}));

export const IconBox = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  aspectRatio: '1 / 1',
  backgroundColor: theme.palette.action.hover,
  borderRadius: theme.shape.borderRadius,
}));

export const IconImage = styled('img')({
  width: '90%',
  height: '90%',
  objectFit: 'contain',
});

export const IconFallback = styled('div')(({ theme }) => ({
  ...theme.typography.caption,
  color: theme.palette.text.disabled,
  fontFamily: 'monospace',
  padding: theme.spacing(0.5),
  textAlign: 'center',
  wordBreak: 'break-all',
  fontSize: 10,
  lineHeight: 1.1,
}));

export const CountRow = styled('div')(({ theme }) => ({
  ...theme.typography.body2,
  fontWeight: 600,
  textAlign: 'center',
  color: theme.palette.text.primary,
  padding: theme.spacing(0, 0.5),
}));

export const MiniCardList = styled('div')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginTop: theme.spacing(0.5),
  marginBottom: theme.spacing(1),
}));
