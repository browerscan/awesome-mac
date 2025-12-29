import type { Access, AccessArgs } from 'payload';

type Role = 'admin' | 'editor';

function getRole(args: AccessArgs): Role | undefined {
  const user = args.req.user as { role?: Role } | undefined;
  return user?.role;
}

export const isAuthenticated: Access = ({ req }) => Boolean(req.user);

export const canManageContent: Access = (args) => {
  const role = getRole(args);
  return role === 'admin' || role === 'editor';
};

export const isAdmin: Access = (args) => getRole(args) === 'admin';

export const readSelfOrAdmin: Access = (args) => {
  const user = args.req.user as { id?: string | number; role?: Role } | null;
  if (!user?.id) return false;
  if (user.role === 'admin') return true;
  return { id: { equals: user.id } };
};

export const updateSelfOrAdmin: Access = readSelfOrAdmin;

export async function canCreateFirstUser(args: AccessArgs): Promise<boolean> {
  const role = getRole(args);
  if (role === 'admin') return true;

  // Allow creating the very first user (bootstrap).
  try {
    const count = await args.req.payload.count({ collection: 'users' });
    return count.totalDocs === 0;
  } catch {
    return false;
  }
}
