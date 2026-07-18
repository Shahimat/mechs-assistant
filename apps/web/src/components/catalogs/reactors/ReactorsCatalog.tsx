import { EquipmentSubCatalog } from '@/components/catalogs/equipment/EquipmentSubCatalog';

export function ReactorsCatalog() {
  return (
    <EquipmentSubCatalog
      subtype="generator"
      title="Каталог реакторов"
      allSectionTitle="Все реакторы"
      soleSectionTitle="Реакторы"
    />
  );
}
