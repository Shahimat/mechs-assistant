import { useEffect, useState, type ReactNode } from 'react';
import { Dialog, DialogContent, IconButton, Typography, Divider, Chip } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { Robot, RobotPrice } from '../types/robot';
import { isOverlaidField, isOverlaidPathOrChildren } from '../utils/overlay';
import { resolveIconUrl } from '../utils/icons';
import { OverlayBadge } from './OverlayBadge';
import { OverlayPill } from '../styles/overlay';
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
} from './RobotDetail.styles';

interface RobotDetailProps {
  robot: Robot | null;
  onClose: () => void;
}

function formatPricePart(value: number, unit: string): string {
  return `${value.toLocaleString('ru-RU')} ${unit}`;
}

function PriceRow({
  robot,
  label,
  price,
  basePath,
}: {
  robot: Robot;
  label: string;
  price?: RobotPrice;
  basePath: string;
}) {
  const bondsOverlaid = isOverlaidField(robot, `${basePath}.bonds`);
  const reglsOverlaid = isOverlaidField(robot, `${basePath}.regls`);
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
              i === 0
                ? [p]
                : [
                    <PriceSeparator key={`sep-${i}`}>/</PriceSeparator>,
                    p,
                  ]
            )}
      </PriceParts>
    </Row>
  );
}

function ValueRow({
  robot,
  label,
  value,
  path,
}: {
  robot: Robot;
  label: string;
  value: ReactNode;
  path: string;
}) {
  const overlaid = isOverlaidPathOrChildren(robot, path);
  return (
    <Row>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <OverlayPill overlaid={overlaid}>{value}</OverlayPill>
    </Row>
  );
}

export function RobotDetail({ robot, onClose }: RobotDetailProps) {
  const [iconFailed, setIconFailed] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const iconUrl = robot?.iconPath ? resolveIconUrl(robot.iconPath) : null;
  const showIcon = iconUrl && !iconFailed;

  useEffect(() => {
    if (!keyCopied) return;
    const t = setTimeout(() => setKeyCopied(false), 1500);
    return () => clearTimeout(t);
  }, [keyCopied]);

  const copyKey = () => {
    if (!robot) return;
    navigator.clipboard?.writeText(robot.key);
    setKeyCopied(true);
  };

  return (
    <Dialog
      open={robot !== null}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onExited: () => setIconFailed(false) }}
    >
      {robot && (
        <>
          <Title>
            <OverlayPill as="span" overlaid={isOverlaidField(robot, 'name')} size="large">
              {robot.name}
            </OverlayPill>
            <Spacer />
            <OverlayBadge robot={robot} size="medium" />
            <IconButton aria-label="Закрыть" onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Title>
          <DialogContent dividers>
            <IconBox>
              {showIcon ? (
                <IconImage
                  src={iconUrl}
                  alt={robot.name}
                  loading="lazy"
                  onError={() => setIconFailed(true)}
                />
              ) : (
                <IconPlaceholder />
              )}
            </IconBox>
            <ChipRow>
              <Chip
                label={robot.type}
                size="small"
                color={isOverlaidField(robot, 'type') ? 'primary' : 'default'}
              />
              {robot.requiredLevel != null && (
                <Chip
                  label={`Ур. ${robot.requiredLevel}`}
                  size="small"
                  color={isOverlaidField(robot, 'requiredLevel') ? 'primary' : 'default'}
                  variant={isOverlaidField(robot, 'requiredLevel') ? 'filled' : 'outlined'}
                />
              )}
              <Chip
                label={robot.model}
                size="small"
                color={isOverlaidField(robot, 'model') ? 'primary' : 'default'}
                variant={isOverlaidField(robot, 'model') ? 'filled' : 'outlined'}
              />
              <KeyChip
                label={keyCopied ? `Скопировано · ${robot.key}` : robot.key}
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
            <ValueRow robot={robot} path="stats.durability" label="Прочность" value={robot.stats.durability} />
            <ValueRow robot={robot} path="stats.armor" label="Броня" value={robot.stats.armor} />
            <ValueRow robot={robot} path="stats.speed" label="Скорость" value={robot.stats.speed} />
            <ValueRow robot={robot} path="stats.maxSpeed" label="Макс. скорость" value={robot.stats.maxSpeed} />
            <ValueRow robot={robot} path="stats.capacity" label="Вместимость" value={robot.stats.capacity} />
            {robot.stats.maxCapacity != null && (
              <ValueRow robot={robot} path="stats.maxCapacity" label="Макс. вместимость" value={robot.stats.maxCapacity} />
            )}
            <ValueRow robot={robot} path="stats.energyFields" label="Энергополя" value={robot.stats.energyFields} />
            {robot.stats.regenerationPerMinute != null && (
              <ValueRow robot={robot} path="stats.regenerationPerMinute" label="Восстановление/мин" value={robot.stats.regenerationPerMinute} />
            )}
            {robot.stats.additionalInvulnerability != null && (
              <ValueRow
                robot={robot}
                path="stats.additionalInvulnerability"
                label="Доп. неуязвимость"
                value={`${robot.stats.additionalInvulnerability}с`}
              />
            )}
            {robot.stats.additionalAcceleration != null && (
              <ValueRow
                robot={robot}
                path="stats.additionalAcceleration"
                label="Доп. ускорение"
                value={`${robot.stats.additionalAcceleration}с`}
              />
            )}

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Цены
            </Typography>
            <PriceRow robot={robot} label="Покупка" price={robot.buyPrice} basePath="buyPrice" />
            <PriceRow robot={robot} label="Продажа" price={robot.sellPrice} basePath="sellPrice" />
            <PriceRow robot={robot} label="Прокачка" price={robot.upgradePrice} basePath="upgradePrice" />
            {robot.upgradeReglPercent != null && (
              <ValueRow robot={robot} path="upgradeReglPercent" label="Прокачка (реглы %)" value={`${robot.upgradeReglPercent}%`} />
            )}
            {robot.itemUpgradePercent != null && (
              <ValueRow robot={robot} path="itemUpgradePercent" label="Прокачка предметов" value={`${robot.itemUpgradePercent}%`} />
            )}

            {(robot.backSideDamage != null ||
              robot.howitzerDamage != null ||
              robot.missChance != null) && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Модификаторы урона
                </Typography>
                {robot.backSideDamage != null && (
                  <ValueRow robot={robot} path="backSideDamage" label="Урон в спину/бок" value={`${robot.backSideDamage}%`} />
                )}
                {robot.howitzerDamage != null && (
                  <ValueRow robot={robot} path="howitzerDamage" label="Урон от гаубиц" value={`${robot.howitzerDamage}%`} />
                )}
                {robot.missChance != null && (
                  <ValueRow robot={robot} path="missChance" label="Вероятность промаха" value={`${robot.missChance}%`} />
                )}
              </>
            )}

            {((robot.extraSlots && robot.extraSlots.length > 0) ||
              (robot.features && robot.features.length > 0)) && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Особенности
                </Typography>
                {robot.extraSlots && robot.extraSlots.length > 0 && (
                  <ValueRow robot={robot} path="extraSlots" label="Доп. слоты" value={robot.extraSlots.join(', ')} />
                )}
                {robot.features && robot.features.length > 0 && (
                  <ValueRow robot={robot} path="features" label="Особенности" value={robot.features.join(', ')} />
                )}
              </>
            )}

            {robot.description && (
              <>
                <Divider sx={{ my: 2 }} />
                <Description>{robot.description}</Description>
              </>
            )}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
