import { EquipmentSubCatalog } from '@/components/catalogs/equipment/EquipmentSubCatalog';

export function CargosCatalog() {
  return (
    <EquipmentSubCatalog
      subtype="cargo"
      title="Каталог трюмов"
      allSectionTitle="Все трюма"
      soleSectionTitle="Трюма"
    />
  );
}
