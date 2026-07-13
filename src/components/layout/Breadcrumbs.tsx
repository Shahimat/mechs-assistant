import { Fragment } from 'react';
import { useMatches, Link as RouterLink, type UIMatch } from 'react-router-dom';
import { Breadcrumbs as MuiBreadcrumbs, Typography, Link } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';

type CrumbHandle = { crumb: string };

function hasCrumbHandle(m: UIMatch): m is UIMatch<unknown, CrumbHandle> {
  const handle = m.handle as { crumb?: unknown } | null | undefined;
  return typeof handle === 'object' && handle !== null && typeof handle.crumb === 'string';
}

export function Breadcrumbs() {
  const matches = useMatches();
  const crumbs = matches.filter(hasCrumbHandle);
  if (crumbs.length === 0) return null;

  return (
    <MuiBreadcrumbs separator={<NavigateNext fontSize="small" />} aria-label="breadcrumbs">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <Fragment key={crumb.id}>
            {isLast ? (
              <Typography color="text.primary" fontWeight={500}>
                {crumb.handle.crumb}
              </Typography>
            ) : (
              <Link component={RouterLink} to={crumb.pathname} underline="hover" color="inherit">
                {crumb.handle.crumb}
              </Link>
            )}
          </Fragment>
        );
      })}
    </MuiBreadcrumbs>
  );
}
