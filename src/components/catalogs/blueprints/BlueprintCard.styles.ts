import { styled } from '@mui/material/styles';
import { Card, IconButton } from '@mui/material';
import { Star, Description } from '@mui/icons-material';

export const StyledCard = styled(Card)({
  position: 'relative',
  height: '100%',
});

export const FavoriteButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(0.5),
  right: theme.spacing(0.5),
  zIndex: 1,
}));

export const StarFilled = styled(Star)(({ theme }) => ({
  color: theme.palette.warning.main,
}));

export const IconBox = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  aspectRatio: '1 / 1',
  backgroundColor: theme.palette.action.hover,
}));

export const IconImage = styled('img')({
  width: '85%',
  height: '85%',
  objectFit: 'contain',
});

export const IconPlaceholder = styled(Description)(({ theme }) => ({
  fontSize: 108,
  color: theme.palette.action.disabled,
}));

export const Header = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  marginBottom: theme.spacing(0.5),
  minWidth: 0,
}));

export const Name = styled('span')(({ theme }) => ({
  ...theme.typography.h6,
  display: 'inline-block',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const Spacer = styled('div')({
  flexGrow: 1,
});

export const ChipRow = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1.5),
  flexWrap: 'wrap',
}));

export const StatList = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
}));

export const StatRow = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
});

/** Имя produce-цели может быть длинным (напр. «Пушка Заморозка»),
 *  ограничиваем одной строкой. */
export const StatValueEllipsis = styled('span')({
  minWidth: 0,
  maxWidth: '65%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
