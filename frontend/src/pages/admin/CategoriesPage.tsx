import { CrudManager } from '../../components/crud/CrudManager';
import { categoriesConfig } from '../../config/entities/categories.config';

export function CategoriesPage() {
  return <CrudManager config={categoriesConfig} />;
}
