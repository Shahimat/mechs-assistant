import { Fragment } from 'react';
import { useMatches, Link as RouterLink } from 'react-router-dom';
import { Breadcrumbs as MuiBreadcrumbs, Typography, Link } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';

type CrumbMatch = {
  id: string;
  pathname: string;
  handle: { crumb: string };
};

function hasCrumbHandle(m: unknown): m is CrumbMatch {
  return (
    typeof m === 'object' &&
    m !== null &&
    typeof (m as { handle?: unknown }).handle === 'object' &&
    (m as { handle?: { crumb?: unknown } }).handle !== null &&
    typeof (m as { handle: { crumb?: unknown } }).handle.crumb === 'string'
  );
}

export function Breadcrumbs() {
  const matches = useMatches();
  const crumbs = matches.filter(hasCrumbHandle);
  if (crumbs.length === 0) return null;

  return (
    <MuiBreadcrumbs
      separator={<NavigateNext fontSize="small" />}
      aria-label="breadcrumbs"
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <Fragment key={crumb.id}>
            {isLast ? (
              <Typography color="text.primary" fontWeight={500}>
                {crumb.handle.crumb}
              </Typography>
            ) : (
              <Link
                component={RouterLink}
                to={crumb.pathname}
                underline="hover"
                color="inherit"
              >
                {crumb.handle.crumb}
              </Link>
            )}
          </Fragment>
        );
      })}
    </MuiBreadcrumbs>
  );
}
