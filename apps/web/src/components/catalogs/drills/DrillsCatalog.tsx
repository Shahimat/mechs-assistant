import { EquipmentSubCatalog } from '@/components/catalogs/equipment/EquipmentSubCatalog';

export function DrillsCatalog() {
  return (
    <EquipmentSubCatalog
      subtype="extractor"
      title="Каталог буров"
      allSectionTitle="Все буры"
      soleSectionTitle="Буры"
    />
  );
}
