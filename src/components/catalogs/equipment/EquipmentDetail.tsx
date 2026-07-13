import { useEffect, useState, type ReactNode } from 'react';
import { Dialog, DialogContent, IconButton, Typography, Divider, Chip } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { Equipment } from '@/types/equipment';
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
} from './EquipmentDetail.styles';

interface EquipmentDetailProps {
  item: Equipment | null;
  onClose: () => void;
}

function formatPricePart(value: number, unit: string): string {
  return `${value.toLocaleString('ru-RU')} ${unit}`;
}

function PriceRow({
  item,
  label,
  price,
  basePath,
}: {
  item: Equipment;
  label: string;
  price?: Price;
  basePath: string;
}) {
  const bondsOverlaid = isOverlaidField(item, `${basePath}.bonds`);
  const reglsOverlaid = isOverlaidField(item, `${basePath}.regls`);
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
  item,
  label,
  value,
  path,
}: {
  item: Equipment;
  label: string;
  value: ReactNode;
  path: string;
}) {
  const overlaid = isOverlaidPathOrChildren(item, path);
  return (
    <Row>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <OverlayPill overlaid={overlaid}>{value}</OverlayPill>
    </Row>
  );
}

export function EquipmentDetail({ item, onClose }: EquipmentDetailProps) {
  const [iconFailed, setIconFailed] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const iconUrl = item?.iconPath ? resolveIconUrl(item.iconPath) : null;
  const showIcon = iconUrl && !iconFailed;

  useEffect(() => {
    if (!keyCopied) return;
    const t = setTimeout(() => setKeyCopied(false), 1500);
    return () => clearTimeout(t);
  }, [keyCopied]);

  const copyKey = () => {
    if (!item) return;
    navigator.clipboard?.writeText(item.key);
    setKeyCopied(true);
  };

  return (
    <Dialog
      open={item !== null}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onExited: () => setIconFailed(false) }}
    >
      {item && (
        <>
          <Title>
            <OverlayPill as="span" overlaid={isOverlaidField(item, 'name')} size="large">
              {item.name}
            </OverlayPill>
            <Spacer />
            <OverlayBadge entity={item} size="medium" />
            <IconButton aria-label="Закрыть" onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Title>
          <DialogContent dividers>
            <IconBox>
              {showIcon ? (
                <IconImage
                  src={iconUrl}
                  alt={item.name}
                  loading="lazy"
                  onError={() => setIconFailed(true)}
                />
              ) : (
                <IconPlaceholder />
              )}
            </IconBox>
            <ChipRow>
              <Chip label={item.subtype} size="small" variant="outlined" title="CSS-subtype" />
              <Chip label={item.family} size="small" variant="outlined" title="CSS-family" />
              {item.slot && (
                <Chip
                  label={item.slot}
                  size="small"
                  variant="outlined"
                  color={isOverlaidField(item, 'slot') ? 'primary' : 'default'}
                />
              )}
              {item.requiredLevel != null && (
                <Chip
                  label={`Ур. ${item.requiredLevel}`}
                  size="small"
                  color={isOverlaidField(item, 'requiredLevel') ? 'primary' : 'default'}
                  variant={isOverlaidField(item, 'requiredLevel') ? 'filled' : 'outlined'}
                />
              )}
              {item.requiredRobotType && (
                <Chip
                  label={item.requiredRobotType}
                  size="small"
                  variant="outlined"
                  color={isOverlaidField(item, 'requiredRobotType') ? 'primary' : 'default'}
                />
              )}
              <KeyChip
                label={keyCopied ? `Скопировано · ${item.key}` : item.key}
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
            {item.stats.primary != null && item.stats.primaryLabel && (
              <ValueRow
                item={item}
                path="stats.primary"
                label={item.stats.primaryLabel}
                value={item.stats.primary}
              />
            )}
            <ValueRow
              item={item}
              path="stats.durability"
              label="Прочность"
              value={item.stats.durability}
            />
            <ValueRow item={item} path="stats.weight" label="Вес" value={item.stats.weight} />

            {(item.buyPrice || item.sellPrice) && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Цены
                </Typography>
                <PriceRow item={item} label="Покупка" price={item.buyPrice} basePath="buyPrice" />
                <PriceRow item={item} label="Продажа" price={item.sellPrice} basePath="sellPrice" />
              </>
            )}

            {item.craftFromBlueprints && item.craftFromBlueprints.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Крафт
                </Typography>
                <ValueRow
                  item={item}
                  path="craftFromBlueprints"
                  label="Из чертежей"
                  value={item.craftFromBlueprints.join(', ')}
                />
              </>
            )}

            {item.description && (
              <>
                <Divider sx={{ my: 2 }} />
                <Description>{item.description}</Description>
              </>
            )}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
