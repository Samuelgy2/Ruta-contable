import { CrudManager } from '../../components/crud/CrudManager';
import { usersConfig } from '../../config/entities/users.config';

export function UsersPage() {
  return <CrudManager config={usersConfig} />;
}
