import { useEffect, useState } from 'react';
import { Dialog, DialogContent, IconButton, Typography, Divider, Chip } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { Skill } from '@/types/skill';
import { isOverlaidField } from '@/utils/overlay';
import { resolveIconUrl } from '@/utils/icons';
import { OverlayBadge } from '@/components/catalog/OverlayBadge';
import { OverlayPill } from '@/styles/overlay';
import { KIND_LABELS } from './kindLabels';
import {
  Title,
  Spacer,
  IconBox,
  IconImage,
  IconPlaceholder,
  ChipRow,
  KeyChip,
  ListRow,
  Description,
} from './SkillDetail.styles';

interface SkillDetailProps {
  skill: Skill | null;
  onClose: () => void;
}

export function SkillDetail({ skill, onClose }: SkillDetailProps) {
  const [iconFailed, setIconFailed] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const iconUrl = skill?.iconPath ? resolveIconUrl(skill.iconPath) : null;
  const showIcon = iconUrl && !iconFailed;

  useEffect(() => {
    if (!keyCopied) return;
    const t = setTimeout(() => setKeyCopied(false), 1500);
    return () => clearTimeout(t);
  }, [keyCopied]);

  const copyKey = () => {
    if (!skill) return;
    navigator.clipboard?.writeText(skill.key);
    setKeyCopied(true);
  };

  return (
    <Dialog
      open={skill !== null}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onExited: () => setIconFailed(false) }}
    >
      {skill && (
        <>
          <Title>
            <OverlayPill as="span" overlaid={isOverlaidField(skill, 'name')} size="large">
              {skill.name}
            </OverlayPill>
            <Spacer />
            <OverlayBadge entity={skill} size="medium" />
            <IconButton aria-label="Закрыть" onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Title>
          <DialogContent dividers>
            <IconBox>
              {showIcon ? (
                <IconImage
                  src={iconUrl}
                  alt={skill.name}
                  loading="lazy"
                  onError={() => setIconFailed(true)}
                />
              ) : (
                <IconPlaceholder />
              )}
            </IconBox>
            <ChipRow>
              <Chip
                label={KIND_LABELS[skill.kind]}
                size="small"
                variant="outlined"
                color={isOverlaidField(skill, 'kind') ? 'primary' : 'default'}
              />
              {skill.perStatPercent != null && (
                <Chip
                  label={`+${skill.perStatPercent}% на 1 стат`}
                  size="small"
                  variant="outlined"
                  color={isOverlaidField(skill, 'perStatPercent') ? 'primary' : 'default'}
                />
              )}
              <KeyChip
                label={keyCopied ? `Скопировано · ${skill.key}` : skill.key}
                size="small"
                variant={keyCopied ? 'filled' : 'outlined'}
                color={keyCopied ? 'success' : 'default'}
                onClick={copyKey}
                title="Скопировать key в буфер обмена"
              />
            </ChipRow>

            {skill.affects.length > 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Влияет на
                </Typography>
                <ListRow>
                  {skill.affects.map((a) => (
                    <Chip key={a} label={a} size="small" variant="outlined" />
                  ))}
                </ListRow>
              </>
            )}

            {skill.description && (
              <>
                <Divider sx={{ my: 2 }} />
                <Description>{skill.description}</Description>
              </>
            )}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
