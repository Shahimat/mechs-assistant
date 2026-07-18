import { memo, useState } from 'react';
import { Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { lookupIconPath, lookupName } from '@/utils/crossCatalogLookup';
import { catalogPathFor } from '@/utils/catalogPath';
import { resolveIconUrl } from '@/utils/icons';
import {
  CardRoot,
  CardBody,
  IconBox,
  IconImage,
  IconFallback,
  CountRow,
} from './IngredientMiniCard.styles';

interface IngredientMiniCardProps {
  /** Каталог, в котором лежит ингредиент (ore/loot/components/…). */
  catalog?: string;
  /** Ключ ингредиента в целевом каталоге. */
  entryKey: string;
  /**
   * Количество, показываемое под иконкой. Если не задано — CountRow
   * не рендерится (используется для рендера ссылок на чертежи в
   * секции «Крафт», где счётчик не нужен).
   */
  count?: number;
}

function IngredientMiniCardImpl({ catalog, entryKey, count }: IngredientMiniCardProps) {
  const [iconFailed, setIconFailed] = useState(false);
  const navigate = useNavigate();

  const name = lookupName(catalog, entryKey);
  const iconPath = lookupIconPath(catalog, entryKey);
  const iconUrl = iconPath ? resolveIconUrl(iconPath) : null;
  const targetHref = catalogPathFor(catalog, entryKey);

  const tooltipTitle = name ?? entryKey;

  const showIcon = iconUrl && !iconFailed;
  const clickable = Boolean(targetHref);

  const handleClick = () => {
    if (targetHref) navigate(targetHref);
  };

  return (
    <Tooltip title={tooltipTitle} arrow placement="top">
      <CardRoot variant="outlined">
        <CardBody
          onClick={handleClick}
          disabled={!clickable}
          aria-label={name ? `Открыть ${name}` : `Открыть ${entryKey}`}
        >
          <IconBox>
            {showIcon ? (
              <IconImage
                src={iconUrl}
                alt={name ?? entryKey}
                loading="lazy"
                onError={() => setIconFailed(true)}
              />
            ) : (
              <IconFallback title={entryKey}>{entryKey}</IconFallback>
            )}
          </IconBox>
          {count != null && <CountRow>×{count.toLocaleString('ru-RU')}</CountRow>}
        </CardBody>
      </CardRoot>
    </Tooltip>
  );
}

export const IngredientMiniCard = memo(IngredientMiniCardImpl);
