import { styled } from '@mui/material/styles';
import { AppBar, Toolbar } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export const Bar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: 'none',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const BarInner = styled(Toolbar)({
  gap: '16px',
});

export const BrandLink = styled(RouterLink)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  textDecoration: 'none',
  color: 'inherit',
}));

export const Logo = styled('img')({
  width: 40,
  height: 40,
  objectFit: 'contain',
});

export const BrandText = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  lineHeight: 1.1,
});

export const BrandTitle = styled('span')(({ theme }) => ({
  ...theme.typography.subtitle1,
  fontWeight: 600,
}));

export const BrandSubtitle = styled('span')(({ theme }) => ({
  ...theme.typography.caption,
  color: theme.palette.text.secondary,
}));

export const CrumbsSlot = styled('div')(({ theme }) => ({
  marginLeft: theme.spacing(3),
  flex: 1,
  minWidth: 0,
}));
