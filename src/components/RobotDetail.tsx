import { useState, type ReactNode } from 'react';
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

interface RobotDetailProps {
  robot: Robot | null;
  onClose: () => void;
}

function formatPrice(price?: RobotPrice): string {
  if (!price) return '—';
  const parts: string[] = [];
  if (price.bonds != null) parts.push(`${price.bonds.toLocaleString('ru-RU')} бонов`);
  if (price.regls != null) parts.push(`${price.regls.toLocaleString('ru-RU')} реглов`);
  return parts.length > 0 ? parts.join(' / ') : '—';
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
}

export function RobotDetail({ robot, onClose }: RobotDetailProps) {
  const [iconFailed, setIconFailed] = useState(false);
  const iconUrl = robot?.iconPath
    ? `${__webpack_public_path__}${robot.iconPath}`
    : null;
  const showIcon = iconUrl && !iconFailed;

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
          <DialogTitle sx={{ pr: 6 }}>
            {robot.name}
            <IconButton
              aria-label="Закрыть"
              onClick={onClose}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
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
              <Chip label={robot.type} size="small" />
              {robot.requiredLevel != null && (
                <Chip label={`Ур. ${robot.requiredLevel}`} size="small" variant="outlined" />
              )}
              <Chip label={robot.model} size="small" variant="outlined" />
            </Stack>

            <Typography variant="subtitle2" gutterBottom>
              Характеристики
            </Typography>
            <Row label="Прочность" value={robot.stats.durability} />
            <Row label="Броня" value={robot.stats.armor} />
            <Row label="Скорость" value={robot.stats.speed} />
            <Row label="Макс. скорость" value={robot.stats.maxSpeed} />
            <Row label="Вместимость" value={robot.stats.capacity} />
            {robot.stats.maxCapacity != null && (
              <Row label="Макс. вместимость" value={robot.stats.maxCapacity} />
            )}
            <Row label="Энергополя" value={robot.stats.energyFields} />
            {robot.stats.regenerationPerMinute != null && (
              <Row label="Восстановление/мин" value={robot.stats.regenerationPerMinute} />
            )}
            {robot.stats.additionalInvulnerability != null && (
              <Row
                label="Доп. неуязвимость"
                value={`${robot.stats.additionalInvulnerability}с`}
              />
            )}
            {robot.stats.additionalAcceleration != null && (
              <Row label="Доп. ускорение" value={`${robot.stats.additionalAcceleration}с`} />
            )}

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Цены
            </Typography>
            <Row label="Покупка" value={formatPrice(robot.buyPrice)} />
            <Row label="Продажа" value={formatPrice(robot.sellPrice)} />
            <Row label="Прокачка" value={formatPrice(robot.upgradePrice)} />
            {robot.upgradeReglPercent != null && (
              <Row label="Прокачка (реглы %)" value={`${robot.upgradeReglPercent}%`} />
            )}
            {robot.itemUpgradePercent != null && (
              <Row label="Прокачка предметов" value={`${robot.itemUpgradePercent}%`} />
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
                  <Row label="Урон в спину/бок" value={`${robot.backSideDamage}%`} />
                )}
                {robot.howitzerDamage != null && (
                  <Row label="Урон от гаубиц" value={`${robot.howitzerDamage}%`} />
                )}
                {robot.missChance != null && (
                  <Row label="Вероятность промаха" value={`${robot.missChance}%`} />
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
                  <Row label="Доп. слоты" value={robot.extraSlots.join(', ')} />
                )}
                {robot.features && robot.features.length > 0 && (
                  <Row label="Особенности" value={robot.features.join(', ')} />
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
