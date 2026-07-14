import { useEffect, useState, type ReactNode } from 'react';
import { Dialog, DialogContent, IconButton, Typography, Divider, Chip } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { Item, LootDrop } from '@/types/item';
import type { Price } from '@/types/common';
import { isOverlaidField, isOverlaidPathOrChildren } from '@/utils/overlay';
import { resolveIconUrl } from '@/utils/icons';
import { OverlayBadge } from '@/components/catalog/OverlayBadge';
import { OverlayPill } from '@/styles/overlay';
import { BlueprintChipList } from '@/components/catalog/BlueprintChipList';
import { SUBTYPE_LABELS } from './subtypeLabels';
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
  DropList,
  DropLabel,
} from './ItemDetail.styles';

interface ItemDetailProps {
  item: Item | null;
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
  item: Item;
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

function LootDropSection({ label, drops }: { label: string; drops: LootDrop[] }) {
  return (
    <>
      <DropLabel>{label}</DropLabel>
      <DropList>
        {drops.map((d, i) => {
          const suffix = d.chance ? ` ×${d.count} (${d.chance})` : ` ×${d.count}`;
          return (
            <Chip
              key={`${d.name}-${i}`}
              label={`${d.name}${suffix}`}
              size="small"
              variant="outlined"
            />
          );
        })}
      </DropList>
    </>
  );
}

function ValueRow({
  item,
  label,
  value,
  path,
}: {
  item: Item;
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

export function ItemDetail({ item, onClose }: ItemDetailProps) {
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
              <Chip
                label={SUBTYPE_LABELS[item.subtype] ?? item.subtype}
                size="small"
                variant="outlined"
                color={isOverlaidField(item, 'subtype') ? 'primary' : 'default'}
              />
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
            {item.stats.creates && item.stats.creates.length > 0 && (
              <LootDropSection label="Создает" drops={item.stats.creates} />
            )}
            {item.stats.createdIn && item.stats.createdIn.length > 0 && (
              <LootDropSection label="Находится в" drops={item.stats.createdIn} />
            )}
            {item.stats.energyRestored != null && (
              <ValueRow
                item={item}
                path="stats.energyRestored"
                label="Восстанавливает энергии"
                value={item.stats.energyRestored}
              />
            )}
            {item.stats.energyConsumption != null && (
              <ValueRow
                item={item}
                path="stats.energyConsumption"
                label="Энергопотребление"
                value={item.stats.energyConsumption}
              />
            )}
            {item.stats.healing != null && (
              <ValueRow
                item={item}
                path="stats.healing"
                label="Восстанавливает"
                value={item.stats.healing}
              />
            )}
            {item.stats.repairPause != null && (
              <ValueRow
                item={item}
                path="stats.repairPause"
                label="Пауза ремонта"
                value={item.stats.repairPause}
              />
            )}
            {item.stats.repairPauseIfNotAttacked != null && (
              <ValueRow
                item={item}
                path="stats.repairPauseIfNotAttacked"
                label="Пауза (не атакован)"
                value={item.stats.repairPauseIfNotAttacked}
              />
            )}
            {item.stats.scanRadius != null && (
              <ValueRow
                item={item}
                path="stats.scanRadius"
                label="Радиус сканирования"
                value={item.stats.scanRadius}
              />
            )}
            {item.stats.duration != null && (
              <ValueRow
                item={item}
                path="stats.duration"
                label="Время действия"
                value={item.stats.duration}
              />
            )}
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
                <BlueprintChipList names={item.craftFromBlueprints} />
              </>
            )}

            {item.providesSkill && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Прибавка к навыку
                </Typography>
                <ValueRow
                  item={item}
                  path="providesSkill"
                  label={item.providesSkill.skillKey}
                  value={`+${item.providesSkill.value}`}
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
