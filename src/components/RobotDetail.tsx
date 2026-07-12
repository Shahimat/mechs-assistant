import { useEffect, useState, type ReactNode } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import { Close, SmartToy } from '@mui/icons-material';
import type { Robot, RobotPrice } from '../types/robot';
import { isOverlaidField, isOverlaidPathOrChildren } from '../utils/overlay';
import { resolveIconUrl } from '../utils/icons';
import { OverlayBadge } from './OverlayBadge';

interface RobotDetailProps {
  robot: Robot | null;
  onClose: () => void;
}

function formatPricePart(value: number, unit: string): string {
  return `${value.toLocaleString('ru-RU')} ${unit}`;
}

function PricePart({
  overlaid,
  children,
}: {
  overlaid: boolean;
  children: ReactNode;
}) {
  return (
    <Box
      component="span"
      sx={{
        color: overlaid ? 'primary.contrastText' : 'inherit',
        bgcolor: overlaid ? 'primary.main' : 'transparent',
        px: overlaid ? 1 : 0,
        borderRadius: overlaid ? 1 : 0,
        lineHeight: 1.6,
      }}
    >
      {children}
    </Box>
  );
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
      <PricePart key="bonds" overlaid={bondsOverlaid}>
        {formatPricePart(price.bonds, 'бонов')}
      </PricePart>
    );
  }
  if (price?.regls != null) {
    parts.push(
      <PricePart key="regls" overlaid={reglsOverlaid}>
        {formatPricePart(price.regls, 'реглов')}
      </PricePart>
    );
  }
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        py: 0.5,
        alignItems: 'center',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', fontWeight: 500 }}>
        {parts.length === 0
          ? '—'
          : parts.flatMap((p, i) =>
              i === 0
                ? [p]
                : [
                    <Box key={`sep-${i}`} component="span" sx={{ color: 'text.secondary' }}>
                      /
                    </Box>,
                    p,
                  ]
            )}
      </Box>
    </Box>
  );
}

function Row({
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
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        py: 0.5,
        alignItems: 'center',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Box
        component="span"
        sx={{
          fontSize: '0.875rem',
          fontWeight: 500,
          color: overlaid ? 'primary.contrastText' : 'inherit',
          bgcolor: overlaid ? 'primary.main' : 'transparent',
          px: overlaid ? 1 : 0,
          borderRadius: overlaid ? 1 : 0,
          lineHeight: 1.6,
        }}
      >
        {value}
      </Box>
    </Box>
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
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                color: isOverlaidField(robot, 'name') ? 'primary.contrastText' : 'inherit',
                bgcolor: isOverlaidField(robot, 'name') ? 'primary.main' : 'transparent',
                px: isOverlaidField(robot, 'name') ? 1.5 : 0,
                py: isOverlaidField(robot, 'name') ? 0.25 : 0,
                borderRadius: isOverlaidField(robot, 'name') ? 1 : 0,
              }}
            >
              {robot.name}
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <OverlayBadge robot={robot} size="medium" />
            <IconButton aria-label="Закрыть" onClick={onClose} size="small">
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 220,
                mb: 2,
                bgcolor: 'action.hover',
                borderRadius: 1,
              }}
            >
              {showIcon ? (
                <Box
                  component="img"
                  src={iconUrl}
                  alt={robot.name}
                  loading="lazy"
                  onError={() => setIconFailed(true)}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    imageRendering: 'high-quality',
                  }}
                />
              ) : (
                <SmartToy sx={{ fontSize: 132, color: 'action.disabled' }} />
              )}
            </Box>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
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
              <Chip
                label={keyCopied ? `Скопировано · ${robot.key}` : robot.key}
                size="small"
                variant={keyCopied ? 'filled' : 'outlined'}
                color={keyCopied ? 'success' : 'default'}
                onClick={copyKey}
                title="Скопировать key в буфер обмена"
                sx={{
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              />
            </Stack>

            <Typography variant="subtitle2" gutterBottom>
              Характеристики
            </Typography>
            <Row robot={robot} path="stats.durability" label="Прочность" value={robot.stats.durability} />
            <Row robot={robot} path="stats.armor" label="Броня" value={robot.stats.armor} />
            <Row robot={robot} path="stats.speed" label="Скорость" value={robot.stats.speed} />
            <Row robot={robot} path="stats.maxSpeed" label="Макс. скорость" value={robot.stats.maxSpeed} />
            <Row robot={robot} path="stats.capacity" label="Вместимость" value={robot.stats.capacity} />
            {robot.stats.maxCapacity != null && (
              <Row robot={robot} path="stats.maxCapacity" label="Макс. вместимость" value={robot.stats.maxCapacity} />
            )}
            <Row robot={robot} path="stats.energyFields" label="Энергополя" value={robot.stats.energyFields} />
            {robot.stats.regenerationPerMinute != null && (
              <Row robot={robot} path="stats.regenerationPerMinute" label="Восстановление/мин" value={robot.stats.regenerationPerMinute} />
            )}
            {robot.stats.additionalInvulnerability != null && (
              <Row
                robot={robot}
                path="stats.additionalInvulnerability"
                label="Доп. неуязвимость"
                value={`${robot.stats.additionalInvulnerability}с`}
              />
            )}
            {robot.stats.additionalAcceleration != null && (
              <Row
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
              <Row robot={robot} path="upgradeReglPercent" label="Прокачка (реглы %)" value={`${robot.upgradeReglPercent}%`} />
            )}
            {robot.itemUpgradePercent != null && (
              <Row robot={robot} path="itemUpgradePercent" label="Прокачка предметов" value={`${robot.itemUpgradePercent}%`} />
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
                  <Row robot={robot} path="backSideDamage" label="Урон в спину/бок" value={`${robot.backSideDamage}%`} />
                )}
                {robot.howitzerDamage != null && (
                  <Row robot={robot} path="howitzerDamage" label="Урон от гаубиц" value={`${robot.howitzerDamage}%`} />
                )}
                {robot.missChance != null && (
                  <Row robot={robot} path="missChance" label="Вероятность промаха" value={`${robot.missChance}%`} />
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
                  <Row robot={robot} path="extraSlots" label="Доп. слоты" value={robot.extraSlots.join(', ')} />
                )}
                {robot.features && robot.features.length > 0 && (
                  <Row robot={robot} path="features" label="Особенности" value={robot.features.join(', ')} />
                )}
              </>
            )}

            {robot.description && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  {robot.description}
                </Typography>
              </>
            )}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
