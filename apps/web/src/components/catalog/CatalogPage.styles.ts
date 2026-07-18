import { styled } from '@mui/material/styles';
import { Container } from '@mui/material';

export const Page = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

export const CenteredPage = styled(Page)({
  display: 'flex',
  justifyContent: 'center',
});
