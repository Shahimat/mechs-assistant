import type { Price, OverlayMeta, Transform } from './common';

export type EquipmentFamily = 'electronic' | 'special' | 'energy' | 'defence';

export type EquipmentSubtype =
  'computer' | 'extractor' | 'cargo' | 'accumulator' | 'generator' | 'armour' | 'shield';

export interface EquipmentStats {
  durability: number;
  weight: number;
  /**
   * Subtype-specific ключевой числовой параметр из вики: «Мощность подъема»
   * у буров, «Трюм» у трюм, «Емкость» у накопителей, «Мощность» у реакторов,
   * «Броня» у брони, «Мощность поля» у энергощитов. У чипов primary
   * отсутствует — эффект в description.
   */
  primary?: number;
  /** Русская подпись primary из вики (для отображения в UI). */
  primaryLabel?: string;
}

export interface Equipment {
  key: string;
  name: string;
  model: string;
  /** Верхний уровень CSS-класса `wiki-item-type-<family>-<subtype>`. */
  family: EquipmentFamily;
  /** Подтип, второй сегмент CSS-класса. */
  subtype: EquipmentSubtype;
  /** Слот установки, например «Доп». */
  slot?: string;
  requiredLevel?: number;
  /** Ограничение по классу меха («Добытчик» у буров). */
  requiredRobotType?: string;
  stats: EquipmentStats;
  buyPrice?: Price;
  sellPrice?: Price;
  craftFromBlueprints?: string[];
  description?: string;
  iconPath?: string;
  wikiUrl?: string;
  /**
   * Трансформация из предыдущего equipment. Данные с td «Преобразуется
   * из» + «Для преобразования требуется» страницы equipment. Есть у
   * большинства armour/accumulator/generator/shield/cargo и одного
   * computer'а; у extractor не встречается; базовые уровни без
   * предшественника не имеют.
   */
  transformsFrom?: Transform;
  _meta?: OverlayMeta;
}
