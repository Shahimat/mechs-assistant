import { useEffect, useState, type ReactNode } from 'react';
import { Dialog, DialogContent, IconButton, Typography, Divider, Chip } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { Loot } from '@/types/loot';
import type { Price } from '@/types/common';
import { isOverlaidField, isOverlaidPathOrChildren } from '@/utils/overlay';
import { resolveIconUrl } from '@/utils/icons';
import { OverlayBadge } from '@/components/catalog/OverlayBadge';
import { OverlayPill } from '@/styles/overlay';
import { SOURCE_LABELS } from './sourceLabels';
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
} from './LootDetail.styles';

interface LootDetailProps {
  loot: Loot | null;
  onClose: () => void;
}

function formatPricePart(value: number, unit: string): string {
  return `${value.toLocaleString('ru-RU')} ${unit}`;
}

function PriceRow({
  loot,
  label,
  price,
  basePath,
}: {
  loot: Loot;
  label: string;
  price?: Price;
  basePath: string;
}) {
  const bondsOverlaid = isOverlaidField(loot, `${basePath}.bonds`);
  const reglsOverlaid = isOverlaidField(loot, `${basePath}.regls`);
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
  loot,
  label,
  value,
  path,
}: {
  loot: Loot;
  label: string;
  value: ReactNode;
  path: string;
}) {
  const overlaid = isOverlaidPathOrChildren(loot, path);
  return (
    <Row>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <OverlayPill overlaid={overlaid}>{value}</OverlayPill>
    </Row>
  );
}

export function LootDetail({ loot, onClose }: LootDetailProps) {
  const [iconFailed, setIconFailed] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const iconUrl = loot?.iconPath ? resolveIconUrl(loot.iconPath) : null;
  const showIcon = iconUrl && !iconFailed;

  useEffect(() => {
    if (!keyCopied) return;
    const t = setTimeout(() => setKeyCopied(false), 1500);
    return () => clearTimeout(t);
  }, [keyCopied]);

  const copyKey = () => {
    if (!loot) return;
    navigator.clipboard?.writeText(loot.key);
    setKeyCopied(true);
  };

  const sourcesOverlaid = loot ? isOverlaidField(loot, 'sources') : false;

  return (
    <Dialog
      open={loot !== null}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onExited: () => setIconFailed(false) }}
    >
      {loot && (
        <>
          <Title>
            <OverlayPill as="span" overlaid={isOverlaidField(loot, 'name')} size="large">
              {loot.name}
            </OverlayPill>
            <Spacer />
            <OverlayBadge entity={loot} size="medium" />
            <IconButton aria-label="Закрыть" onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Title>
          <DialogContent dividers>
            <IconBox>
              {showIcon ? (
                <IconImage
                  src={iconUrl}
                  alt={loot.name}
                  loading="lazy"
                  onError={() => setIconFailed(true)}
                />
              ) : (
                <IconPlaceholder />
              )}
            </IconBox>
            <ChipRow>
              {loot.sources.map((s) => (
                <Chip
                  key={s}
                  label={SOURCE_LABELS[s] ?? s}
                  size="small"
                  variant="outlined"
                  color={sourcesOverlaid ? 'primary' : 'default'}
                />
              ))}
              <KeyChip
                label={keyCopied ? `Скопировано · ${loot.key}` : loot.key}
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
            <ValueRow loot={loot} path="stats.weight" label="Вес" value={loot.stats.weight} />

            {loot.sellPrice && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Цены
                </Typography>
                <PriceRow loot={loot} label="Продажа" price={loot.sellPrice} basePath="sellPrice" />
              </>
            )}

            {loot.foundIn && loot.foundIn.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Источники
                </Typography>
                <SectionLabel>Находится в</SectionLabel>
                <ListRow>
                  {loot.foundIn.map((name, i) => (
                    <Chip key={`${name}-${i}`} label={name} size="small" variant="outlined" />
                  ))}
                </ListRow>
              </>
            )}

            {loot.description && (
              <>
                <Divider sx={{ my: 2 }} />
                <Description>{loot.description}</Description>
              </>
            )}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
