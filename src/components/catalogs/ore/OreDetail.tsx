import { useEffect, useState, type ReactNode } from 'react';
import { Dialog, DialogContent, IconButton, Typography, Divider, Chip } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { Ore } from '@/types/ore';
import type { Price } from '@/types/common';
import { isOverlaidField, isOverlaidPathOrChildren } from '@/utils/overlay';
import { resolveIconUrl } from '@/utils/icons';
import { OverlayBadge } from '@/components/catalog/OverlayBadge';
import { OverlayPill } from '@/styles/overlay';
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
  SourceList,
  SectionLabel,
} from './OreDetail.styles';

interface OreDetailProps {
  ore: Ore | null;
  onClose: () => void;
}

function formatPricePart(value: number, unit: string): string {
  return `${value.toLocaleString('ru-RU')} ${unit}`;
}

function PriceRow({
  ore,
  label,
  price,
  basePath,
}: {
  ore: Ore;
  label: string;
  price?: Price;
  basePath: string;
}) {
  const bondsOverlaid = isOverlaidField(ore, `${basePath}.bonds`);
  const reglsOverlaid = isOverlaidField(ore, `${basePath}.regls`);
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
  ore,
  label,
  value,
  path,
}: {
  ore: Ore;
  label: string;
  value: ReactNode;
  path: string;
}) {
  const overlaid = isOverlaidPathOrChildren(ore, path);
  return (
    <Row>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <OverlayPill overlaid={overlaid}>{value}</OverlayPill>
    </Row>
  );
}

export function OreDetail({ ore, onClose }: OreDetailProps) {
  const [iconFailed, setIconFailed] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const iconUrl = ore?.iconPath ? resolveIconUrl(ore.iconPath) : null;
  const showIcon = iconUrl && !iconFailed;

  useEffect(() => {
    if (!keyCopied) return;
    const t = setTimeout(() => setKeyCopied(false), 1500);
    return () => clearTimeout(t);
  }, [keyCopied]);

  const copyKey = () => {
    if (!ore) return;
    navigator.clipboard?.writeText(ore.key);
    setKeyCopied(true);
  };

  return (
    <Dialog
      open={ore !== null}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onExited: () => setIconFailed(false) }}
    >
      {ore && (
        <>
          <Title>
            <OverlayPill as="span" overlaid={isOverlaidField(ore, 'name')} size="large">
              {ore.name}
            </OverlayPill>
            <Spacer />
            <OverlayBadge entity={ore} size="medium" />
            <IconButton aria-label="Закрыть" onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Title>
          <DialogContent dividers>
            <IconBox>
              {showIcon ? (
                <IconImage
                  src={iconUrl}
                  alt={ore.name}
                  loading="lazy"
                  onError={() => setIconFailed(true)}
                />
              ) : (
                <IconPlaceholder />
              )}
            </IconBox>
            <ChipRow>
              <KeyChip
                label={keyCopied ? `Скопировано · ${ore.key}` : ore.key}
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
            <ValueRow ore={ore} path="stats.weight" label="Вес" value={ore.stats.weight} />

            {ore.sellPrice && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Цены
                </Typography>
                <PriceRow ore={ore} label="Продажа" price={ore.sellPrice} basePath="sellPrice" />
              </>
            )}

            {ore.foundIn && ore.foundIn.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Источники
                </Typography>
                <SectionLabel>Находится в</SectionLabel>
                <SourceList>
                  {ore.foundIn.map((name, i) => (
                    <Chip key={`${name}-${i}`} label={name} size="small" variant="outlined" />
                  ))}
                </SourceList>
              </>
            )}

            {ore.craftFromBlueprints && ore.craftFromBlueprints.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Крафт
                </Typography>
                <ValueRow
                  ore={ore}
                  path="craftFromBlueprints"
                  label="Из чертежей"
                  value={ore.craftFromBlueprints.join(', ')}
                />
              </>
            )}

            {ore.description && (
              <>
                <Divider sx={{ my: 2 }} />
                <Description>{ore.description}</Description>
              </>
            )}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
