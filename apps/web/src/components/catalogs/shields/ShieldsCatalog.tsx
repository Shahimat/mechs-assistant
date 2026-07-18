import { EquipmentSubCatalog } from '@/components/catalogs/equipment/EquipmentSubCatalog';

export function ShieldsCatalog() {
  return (
    <EquipmentSubCatalog
      subtype="shield"
      title="Каталог энергощитов"
      allSectionTitle="Все энергощиты"
      soleSectionTitle="Энергощиты"
    />
  );
}
