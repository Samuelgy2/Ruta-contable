import { CrudManager } from '../../components/crud/CrudManager';
import { membersConfig } from '../../config/entities/members.config';

export function MembersPage() {
  return <CrudManager config={membersConfig} />;
}
