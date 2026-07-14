import { useEffect, useState, type ReactNode } from 'react';
import { Dialog, DialogContent, IconButton, Typography, Divider, Chip } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { Blueprint } from '@/types/blueprint';
import type { Price } from '@/types/common';
import { isOverlaidField, isOverlaidPathOrChildren } from '@/utils/overlay';
import { resolveIconUrl } from '@/utils/icons';
import { lookupName } from '@/utils/crossCatalogLookup';
import { OverlayBadge } from '@/components/catalog/OverlayBadge';
import { OverlayPill } from '@/styles/overlay';
import { IngredientMiniCard } from '@/components/catalog/IngredientMiniCard';
import { MiniCardList } from '@/components/catalog/IngredientMiniCard.styles';
import { CATEGORY_LABELS } from './categoryLabels';
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
  DescriptionText,
  ChipList,
} from './BlueprintDetail.styles';

interface BlueprintDetailProps {
  blueprint: Blueprint | null;
  onClose: () => void;
}

function formatPricePart(value: number, unit: string): string {
  return `${value.toLocaleString('ru-RU')} ${unit}`;
}

function PriceRow({
  blueprint,
  label,
  price,
  basePath,
}: {
  blueprint: Blueprint;
  label: string;
  price?: Price;
  basePath: string;
}) {
  const bondsOverlaid = isOverlaidField(blueprint, `${basePath}.bonds`);
  const reglsOverlaid = isOverlaidField(blueprint, `${basePath}.regls`);
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
  blueprint,
  label,
  value,
  path,
}: {
  blueprint: Blueprint;
  label: string;
  value: ReactNode;
  path: string;
}) {
  const overlaid = isOverlaidPathOrChildren(blueprint, path);
  return (
    <Row>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <OverlayPill overlaid={overlaid}>{value}</OverlayPill>
    </Row>
  );
}

export function BlueprintDetail({ blueprint, onClose }: BlueprintDetailProps) {
  const [iconFailed, setIconFailed] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const iconUrl = blueprint?.iconPath ? resolveIconUrl(blueprint.iconPath) : null;
  const showIcon = iconUrl && !iconFailed;

  useEffect(() => {
    if (!keyCopied) return;
    const t = setTimeout(() => setKeyCopied(false), 1500);
    return () => clearTimeout(t);
  }, [keyCopied]);

  const copyKey = () => {
    if (!blueprint) return;
    navigator.clipboard?.writeText(blueprint.key);
    setKeyCopied(true);
  };

  const producedName = blueprint
    ? (lookupName(blueprint.producesCatalog, blueprint.producesKey) ?? blueprint.producesKey)
    : '';

  const hasRequirements =
    blueprint &&
    (blueprint.skillSpecialist != null ||
      blueprint.bondsCost != null ||
      blueprint.reglsCost != null);

  return (
    <Dialog
      open={blueprint !== null}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onExited: () => setIconFailed(false) }}
    >
      {blueprint && (
        <>
          <Title>
            <OverlayPill as="span" overlaid={isOverlaidField(blueprint, 'name')} size="large">
              {blueprint.name}
            </OverlayPill>
            <Spacer />
            <OverlayBadge entity={blueprint} size="medium" />
            <IconButton aria-label="Закрыть" onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Title>
          <DialogContent dividers>
            <IconBox>
              {showIcon ? (
                <IconImage
                  src={iconUrl}
                  alt={blueprint.name}
                  loading="lazy"
                  onError={() => setIconFailed(true)}
                />
              ) : (
                <IconPlaceholder />
              )}
            </IconBox>
            <ChipRow>
              <Chip
                label={CATEGORY_LABELS[blueprint.category] ?? blueprint.category}
                size="small"
                variant="outlined"
                color={isOverlaidField(blueprint, 'category') ? 'primary' : 'default'}
              />
              {blueprint.subtype && (
                <Chip
                  label={blueprint.subtype}
                  size="small"
                  variant="outlined"
                  color={isOverlaidField(blueprint, 'subtype') ? 'primary' : 'default'}
                />
              )}
              <KeyChip
                label={keyCopied ? `Скопировано · ${blueprint.key}` : blueprint.key}
                size="small"
                variant={keyCopied ? 'filled' : 'outlined'}
                color={keyCopied ? 'success' : 'default'}
                onClick={copyKey}
                title="Скопировать key в буфер обмена"
              />
            </ChipRow>

            <Typography variant="subtitle2" gutterBottom>
              Производит
            </Typography>
            <ValueRow
              blueprint={blueprint}
              path="producesKey"
              label={`${producedName} ×${blueprint.output}`}
              value={
                blueprint.producesCatalog
                  ? `[${blueprint.producesCatalog}] ${blueprint.producesKey}`
                  : blueprint.producesKey
              }
            />

            {blueprint.ingredients.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Ингредиенты
                </Typography>
                <MiniCardList>
                  {blueprint.ingredients.map((ing, i) => (
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

            {hasRequirements && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Требования
                </Typography>
                <ChipList>
                  {blueprint.skillSpecialist != null && (
                    <Chip
                      label={`Навык специалист: ${blueprint.skillSpecialist}`}
                      size="small"
                      variant="outlined"
                      color={isOverlaidField(blueprint, 'skillSpecialist') ? 'primary' : 'default'}
                    />
                  )}
                  {blueprint.bondsCost != null && (
                    <Chip
                      label={`Боны: ${blueprint.bondsCost.toLocaleString('ru-RU')}`}
                      size="small"
                      variant="outlined"
                      color={isOverlaidField(blueprint, 'bondsCost') ? 'primary' : 'default'}
                    />
                  )}
                  {blueprint.reglsCost != null && (
                    <Chip
                      label={`Реглы: ${blueprint.reglsCost.toLocaleString('ru-RU')}`}
                      size="small"
                      variant="outlined"
                      color={isOverlaidField(blueprint, 'reglsCost') ? 'primary' : 'default'}
                    />
                  )}
                </ChipList>
              </>
            )}

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              О чертеже
            </Typography>
            <ValueRow
              blueprint={blueprint}
              path="stats.durability"
              label="Прочность (использований)"
              value={blueprint.stats.durability}
            />
            {blueprint.sellPrice && (
              <PriceRow
                blueprint={blueprint}
                label="Цена продажи"
                price={blueprint.sellPrice}
                basePath="sellPrice"
              />
            )}

            {blueprint.description && (
              <>
                <Divider sx={{ my: 2 }} />
                <DescriptionText>{blueprint.description}</DescriptionText>
              </>
            )}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
