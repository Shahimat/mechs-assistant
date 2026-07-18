import { EquipmentSubCatalog } from '@/components/catalogs/equipment/EquipmentSubCatalog';

export function ChipsCatalog() {
  return (
    <EquipmentSubCatalog
      subtype="computer"
      title="Каталог чипов"
      allSectionTitle="Все чипы"
      soleSectionTitle="Чипы"
    />
  );
}
