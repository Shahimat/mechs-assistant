import { useEffect, useState, type ReactNode } from 'react';
import { Dialog, DialogContent, IconButton, Typography, Divider, Chip } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { Weapon } from '@/types/weapon';
import type { Price } from '@/types/common';
import { isOverlaidField, isOverlaidPathOrChildren } from '@/utils/overlay';
import { resolveIconUrl } from '@/utils/icons';
import { OverlayBadge } from '@/components/catalog/OverlayBadge';
import { OverlayPill } from '@/styles/overlay';
import { IngredientMiniCard } from '@/components/catalog/IngredientMiniCard';
import { MiniCardList } from '@/components/catalog/IngredientMiniCard.styles';
import { BlueprintChipList } from '@/components/catalog/BlueprintChipList';
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
  InlineLabel,
} from './WeaponDetail.styles';

interface WeaponDetailProps {
  weapon: Weapon | null;
  onClose: () => void;
}

function formatPricePart(value: number, unit: string): string {
  return `${value.toLocaleString('ru-RU')} ${unit}`;
}

function PriceRow({
  weapon,
  label,
  price,
  basePath,
}: {
  weapon: Weapon;
  label: string;
  price?: Price;
  basePath: string;
}) {
  const bondsOverlaid = isOverlaidField(weapon, `${basePath}.bonds`);
  const reglsOverlaid = isOverlaidField(weapon, `${basePath}.regls`);
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
  weapon,
  label,
  value,
  path,
}: {
  weapon: Weapon;
  label: string;
  value: ReactNode;
  path: string;
}) {
  const overlaid = isOverlaidPathOrChildren(weapon, path);
  return (
    <Row>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <OverlayPill overlaid={overlaid}>{value}</OverlayPill>
    </Row>
  );
}

export function WeaponDetail({ weapon, onClose }: WeaponDetailProps) {
  const [iconFailed, setIconFailed] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const iconUrl = weapon?.iconPath ? resolveIconUrl(weapon.iconPath) : null;
  const showIcon = iconUrl && !iconFailed;

  useEffect(() => {
    if (!keyCopied) return;
    const t = setTimeout(() => setKeyCopied(false), 1500);
    return () => clearTimeout(t);
  }, [keyCopied]);

  const copyKey = () => {
    if (!weapon) return;
    navigator.clipboard?.writeText(weapon.key);
    setKeyCopied(true);
  };

  return (
    <Dialog
      open={weapon !== null}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onExited: () => setIconFailed(false) }}
    >
      {weapon && (
        <>
          <Title>
            <OverlayPill as="span" overlaid={isOverlaidField(weapon, 'name')} size="large">
              {weapon.name}
            </OverlayPill>
            <Spacer />
            <OverlayBadge entity={weapon} size="medium" />
            <IconButton aria-label="Закрыть" onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Title>
          <DialogContent dividers>
            <IconBox>
              {showIcon ? (
                <IconImage
                  src={iconUrl}
                  alt={weapon.name}
                  loading="lazy"
                  onError={() => setIconFailed(true)}
                />
              ) : (
                <IconPlaceholder />
              )}
            </IconBox>
            <ChipRow>
              {weapon.group && (
                <Chip
                  label={weapon.group}
                  size="small"
                  color={isOverlaidField(weapon, 'group') ? 'primary' : 'default'}
                />
              )}
              <Chip
                label={weapon.category}
                size="small"
                variant="outlined"
                title="CSS-категория из вики"
              />
              {weapon.slot && (
                <Chip
                  label={weapon.slot}
                  size="small"
                  variant="outlined"
                  color={isOverlaidField(weapon, 'slot') ? 'primary' : 'default'}
                />
              )}
              {weapon.requiredLevel != null && (
                <Chip
                  label={`Ур. ${weapon.requiredLevel}`}
                  size="small"
                  color={isOverlaidField(weapon, 'requiredLevel') ? 'primary' : 'default'}
                  variant={isOverlaidField(weapon, 'requiredLevel') ? 'filled' : 'outlined'}
                />
              )}
              <KeyChip
                label={keyCopied ? `Скопировано · ${weapon.key}` : weapon.key}
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
              weapon={weapon}
              path="stats.damageMin"
              label="Урон"
              value={
                weapon.stats.damageMin === weapon.stats.damageMax
                  ? String(weapon.stats.damageMin)
                  : `${weapon.stats.damageMin} – ${weapon.stats.damageMax}`
              }
            />
            <ValueRow
              weapon={weapon}
              path="stats.range"
              label="Дальность"
              value={weapon.stats.range}
            />
            {weapon.stats.minRange != null && (
              <ValueRow
                weapon={weapon}
                path="stats.minRange"
                label="Мёртвая зона"
                value={weapon.stats.minRange}
              />
            )}
            <ValueRow
              weapon={weapon}
              path="stats.rateOfFire"
              label="Скорострельность"
              value={`${weapon.stats.rateOfFire}/мин`}
            />
            <ValueRow
              weapon={weapon}
              path="stats.energyConsumption"
              label="Энергопотребление"
              value={weapon.stats.energyConsumption}
            />
            {weapon.stats.ammo != null && (
              <ValueRow
                weapon={weapon}
                path="stats.ammo"
                label="Боезапас"
                value={weapon.stats.ammo}
              />
            )}
            <ValueRow
              weapon={weapon}
              path="stats.durability"
              label="Прочность"
              value={weapon.stats.durability}
            />
            <ValueRow weapon={weapon} path="stats.weight" label="Вес" value={weapon.stats.weight} />

            {(weapon.buyPrice || weapon.sellPrice) && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Цены
                </Typography>
                <PriceRow
                  weapon={weapon}
                  label="Покупка"
                  price={weapon.buyPrice}
                  basePath="buyPrice"
                />
                <PriceRow
                  weapon={weapon}
                  label="Продажа"
                  price={weapon.sellPrice}
                  basePath="sellPrice"
                />
              </>
            )}

            {weapon.craftFromBlueprints && weapon.craftFromBlueprints.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Крафт
                </Typography>
                <BlueprintChipList names={weapon.craftFromBlueprints} />
              </>
            )}

            {weapon.transformsFrom && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Преобразование
                </Typography>
                <ValueRow
                  weapon={weapon}
                  path="transformsFrom.fromKey"
                  label="Из"
                  value={weapon.transformsFrom.fromKey}
                />
                {weapon.transformsFrom.ingredients.length > 0 && (
                  <>
                    <InlineLabel>Ингредиенты</InlineLabel>
                    <MiniCardList>
                      {weapon.transformsFrom.ingredients.map((ing, i) => (
                        <IngredientMiniCard
                          key={`${ing.key}-${i}`}
                          catalog={ing.catalog}
                          entryKey={ing.key}
                          count={ing.count}
                        />
                      ))}
                    </MiniCardList>
                  </>
                )}
                {(weapon.transformsFrom.bondsCost != null ||
                  weapon.transformsFrom.reglsCost != null) && (
                  <Row>
                    <Typography variant="body2" color="text.secondary">
                      Стоимость
                    </Typography>
                    <PriceParts>
                      {weapon.transformsFrom.bondsCost != null && (
                        <OverlayPill overlaid={isOverlaidField(weapon, 'transformsFrom.bondsCost')}>
                          {formatPricePart(weapon.transformsFrom.bondsCost, 'бонов')}
                        </OverlayPill>
                      )}
                      {weapon.transformsFrom.bondsCost != null &&
                        weapon.transformsFrom.reglsCost != null && (
                          <PriceSeparator>/</PriceSeparator>
                        )}
                      {weapon.transformsFrom.reglsCost != null && (
                        <OverlayPill overlaid={isOverlaidField(weapon, 'transformsFrom.reglsCost')}>
                          {formatPricePart(weapon.transformsFrom.reglsCost, 'реглов')}
                        </OverlayPill>
                      )}
                    </PriceParts>
                  </Row>
                )}
              </>
            )}

            {weapon.description && (
              <>
                <Divider sx={{ my: 2 }} />
                <Description>{weapon.description}</Description>
              </>
            )}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
