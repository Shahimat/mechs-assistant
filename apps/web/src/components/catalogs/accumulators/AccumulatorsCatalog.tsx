import { EquipmentSubCatalog } from '@/components/catalogs/equipment/EquipmentSubCatalog';

export function AccumulatorsCatalog() {
  return (
    <EquipmentSubCatalog
      subtype="accumulator"
      title="Каталог накопителей"
      allSectionTitle="Все накопители"
      soleSectionTitle="Накопители"
    />
  );
}
