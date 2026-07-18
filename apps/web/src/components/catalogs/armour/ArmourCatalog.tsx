import { EquipmentSubCatalog } from '@/components/catalogs/equipment/EquipmentSubCatalog';

export function ArmourCatalog() {
  return (
    <EquipmentSubCatalog
      subtype="armour"
      title="Каталог брони"
      allSectionTitle="Вся броня"
      soleSectionTitle="Броня"
    />
  );
}
