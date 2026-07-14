import { lookupBlueprintKeyByName } from '@/utils/crossCatalogLookup';
import { IngredientMiniCard } from './IngredientMiniCard';
import { MiniCardList } from './IngredientMiniCard.styles';

interface BlueprintChipListProps {
  /**
   * Массив отображаемых имён чертежей — как поле `craftFromBlueprints`
   * у weapons/equipment/components/items/ore/loot.
   */
  names: string[];
}

/**
 * Рендерит имена чертежей мини-карточками (иконка чертежа с фоном-
 * «планшетом»). Имя резолвится в key через `lookupBlueprintKeyByName`;
 * если найден — карточка кликабельна и ведёт в blueprints-catalog?open=<key>
 * (навигация — внутри `IngredientMiniCard` через `catalogPathFor`).
 * Нерезолвленные имена рендерятся с key=name (fallback-плейсхолдер
 * покажет имя, клик не сработает).
 */
export function BlueprintChipList({ names }: BlueprintChipListProps) {
  return (
    <MiniCardList>
      {names.map((name, i) => {
        // Если blueprint-запись не нашлась по имени — карточка остаётся
        // не-кликабельной: catalog=undefined отключит targetHref в
        // IngredientMiniCard, entryKey=name отобразится как плейсхолдер.
        const key = lookupBlueprintKeyByName(name);
        return (
          <IngredientMiniCard
            key={`${name}-${i}`}
            catalog={key ? 'blueprints' : undefined}
            entryKey={key ?? name}
          />
        );
      })}
    </MiniCardList>
  );
}
