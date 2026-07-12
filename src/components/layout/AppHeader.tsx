import logoUrl from '@img/logo.webp';
import { Breadcrumbs } from './Breadcrumbs';
import {
  Bar,
  BarInner,
  BrandLink,
  Logo,
  BrandText,
  BrandTitle,
  BrandSubtitle,
  CrumbsSlot,
} from './AppHeader.styles';

export function AppHeader() {
  return (
    <Bar position="sticky">
      <BarInner>
        <BrandLink to="/">
          <Logo src={logoUrl} alt="Мехи.Земля" />
          <BrandText>
            <BrandTitle>Мехи.Земля</BrandTitle>
            <BrandSubtitle>Ассистент</BrandSubtitle>
          </BrandText>
        </BrandLink>
        <CrumbsSlot>
          <Breadcrumbs />
        </CrumbsSlot>
      </BarInner>
    </Bar>
  );
}
