import { useEffect, useState, type ReactNode } from 'react';
import { Dialog, DialogContent, IconButton, Typography, Divider, Chip } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { Component } from '@/types/component';
import type { Price } from '@/types/common';
import { isOverlaidField, isOverlaidPathOrChildren } from '@/utils/overlay';
import { resolveIconUrl } from '@/utils/icons';
import { OverlayBadge } from '@/components/catalog/OverlayBadge';
import { OverlayPill } from '@/styles/overlay';
import { BlueprintChipList } from '@/components/catalog/BlueprintChipList';
import { KIND_LABELS } from './kindLabels';
import {
  Title,
  Spacer,
  IconBox,
  IconImage,
  IconPlaceholder,
  ChipRow,
  KeyChip,
  Row,
  PriceParts,
  PriceSeparator,
  Description,
  ListRow,
  SectionLabel,
} from './ComponentDetail.styles';

interface ComponentDetailProps {
  component: Component | null;
  onClose: () => void;
}

function formatPricePart(value: number, unit: string): string {
  return `${value.toLocaleString('ru-RU')} ${unit}`;
}

function PriceRow({
  component,
  label,
  price,
  basePath,
}: {
  component: Component;
  label: string;
  price?: Price;
  basePath: string;
}) {
  const bondsOverlaid = isOverlaidField(component, `${basePath}.bonds`);
  const reglsOverlaid = isOverlaidField(component, `${basePath}.regls`);
  const parts: ReactNode[] = [];
  if (price?.bonds != null) {
    parts.push(
      <OverlayPill key="bonds" overlaid={bondsOverlaid}>
        {formatPricePart(price.bonds, 'бонов')}
      </OverlayPill>
    );
  }
  if (price?.regls != null) {
    parts.push(
      <OverlayPill key="regls" overlaid={reglsOverlaid}>
        {formatPricePart(price.regls, 'реглов')}
      </OverlayPill>
    );
  }
  return (
    <Row>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <PriceParts>
        {parts.length === 0
          ? '—'
          : parts.flatMap((p, i) =>
              i === 0 ? [p] : [<PriceSeparator key={`sep-${i}`}>/</PriceSeparator>, p]
            )}
      </PriceParts>
    </Row>
  );
}

function ValueRow({
  component,
  label,
  value,
  path,
}: {
  component: Component;
  label: string;
  value: ReactNode;
  path: string;
}) {
  const overlaid = isOverlaidPathOrChildren(component, path);
  return (
    <Row>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <OverlayPill overlaid={overlaid}>{value}</OverlayPill>
    </Row>
  );
}

export function ComponentDetail({ component, onClose }: ComponentDetailProps) {
  const [iconFailed, setIconFailed] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const iconUrl = component?.iconPath ? resolveIconUrl(component.iconPath) : null;
  const showIcon = iconUrl && !iconFailed;

  useEffect(() => {
    if (!keyCopied) return;
    const t = setTimeout(() => setKeyCopied(false), 1500);
    return () => clearTimeout(t);
  }, [keyCopied]);

  const copyKey = () => {
    if (!component) return;
    navigator.clipboard?.writeText(component.key);
    setKeyCopied(true);
  };

  return (
    <Dialog
      open={component !== null}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onExited: () => setIconFailed(false) }}
    >
      {component && (
        <>
          <Title>
            <OverlayPill as="span" overlaid={isOverlaidField(component, 'name')} size="large">
              {component.name}
            </OverlayPill>
            <Spacer />
            <OverlayBadge entity={component} size="medium" />
            <IconButton aria-label="Закрыть" onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Title>
          <DialogContent dividers>
            <IconBox>
              {showIcon ? (
                <IconImage
                  src={iconUrl}
                  alt={component.name}
                  loading="lazy"
                  onError={() => setIconFailed(true)}
                />
              ) : (
                <IconPlaceholder />
              )}
            </IconBox>
            <ChipRow>
              {component.kind && (
                <Chip
                  label={KIND_LABELS[component.kind]}
                  size="small"
                  variant="outlined"
                  color={isOverlaidField(component, 'kind') ? 'primary' : 'default'}
                />
              )}
              <KeyChip
                label={keyCopied ? `Скопировано · ${component.key}` : component.key}
                size="small"
                variant={keyCopied ? 'filled' : 'outlined'}
                color={keyCopied ? 'success' : 'default'}
                onClick={copyKey}
                title="Скопировать key в буфер обмена"
              />
            </ChipRow>

            <Typography variant="subtitle2" gutterBottom>
              Характеристики
            </Typography>
            <ValueRow
              component={component}
              path="stats.weight"
              label="Вес"
              value={component.stats.weight}
            />

            {component.sellPrice && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Цены
                </Typography>
                <PriceRow
                  component={component}
                  label="Продажа"
                  price={component.sellPrice}
                  basePath="sellPrice"
                />
              </>
            )}

            {component.recipe && component.recipe.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Рецепт
                </Typography>
                <SectionLabel>Из чего собирается</SectionLabel>
                <ListRow>
                  {component.recipe.map((r, i) => (
                    <Chip
                      key={`${r.name}-${i}`}
                      label={`${r.name} ×${r.count}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </ListRow>
              </>
            )}

            {component.craftFromBlueprints && component.craftFromBlueprints.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Крафт
                </Typography>
                <BlueprintChipList names={component.craftFromBlueprints} />
              </>
            )}

            {component.description && (
              <>
                <Divider sx={{ my: 2 }} />
                <Description>{component.description}</Description>
              </>
            )}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
