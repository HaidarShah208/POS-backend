import { AppDataSource } from "../../config/data-source.js";
import { Roles } from "../../models/Roles.js";
import { IsNull } from "typeorm";

const roleRepo = () => AppDataSource.getRepository(Roles);

export async function getRoles(organizationId: string | null): Promise<Roles[]> {
  const systemRoles = await roleRepo().find({
    where: { organizationId: IsNull(), isSystem: true },
    order: { createdAt: "ASC" },
  });

  if (!organizationId) return systemRoles;

  const customRoles = await roleRepo().find({
    where: { organizationId },
    order: { createdAt: "ASC" },
  });

  return [...systemRoles, ...customRoles];
}

export async function getRoleById(id: string, organizationId: string | null): Promise<Roles | null> {
  const role = await roleRepo().findOne({ where: { id } });
  if (!role) return null;

  if (role.isSystem) return role;
  if (role.organizationId === organizationId) return role;

  return null;
}

export async function getRoleBySlug(slug: string, organizationId: string | null): Promise<Roles | null> {
  if (organizationId) {
    const orgRole = await roleRepo().findOne({ where: { slug, organizationId } });
    if (orgRole) return orgRole;
  }

  return roleRepo().findOne({ where: { slug, organizationId: IsNull(), isSystem: true } });
}

export async function createRole(
  data: { name: string; description?: string; permissions: string[] },
  organizationId: string,
  actorId?: string
): Promise<Roles> {
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  const existing = await roleRepo().findOne({ where: { slug, organizationId } });
  if (existing) throw new Error("Role with this name already exists");

  const systemConflict = await roleRepo().findOne({
    where: { slug, organizationId: IsNull(), isSystem: true },
  });
  if (systemConflict) throw new Error("Cannot use a system role name");

  const role = roleRepo().create({
    name: data.name,
    slug,
    description: data.description || null,
    permissions: data.permissions,
    isSystem: false,
    organizationId,
  });

  await roleRepo().save(role);

  const { logAudit } = await import("../../services/audit.service.js");
  await logAudit({
    organizationId,
    actorId: actorId || null,
    action: "role.created",
    resource: "roles",
    resourceId: role.id,
    meta: { name: role.name, permissions: role.permissions },
  });

  return role;
}

export async function updateRole(
  id: string,
  data: { name?: string; description?: string; permissions?: string[] },
  organizationId: string,
  actorId?: string
): Promise<Roles> {
  const role = await roleRepo().findOne({ where: { id, organizationId } });
  if (!role) throw new Error("Role not found");
  if (role.isSystem) throw new Error("Cannot edit system roles");

  if (data.name !== undefined) {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    if (slug !== role.slug) {
      const conflict = await roleRepo().findOne({ where: { slug, organizationId } });
      if (conflict) throw new Error("Role with this name already exists");

      const systemConflict = await roleRepo().findOne({
        where: { slug, organizationId: IsNull(), isSystem: true },
      });
      if (systemConflict) throw new Error("Cannot use a system role name");

      role.slug = slug;
    }
    role.name = data.name;
  }

  if (data.description !== undefined) role.description = data.description || null;
  if (data.permissions !== undefined) role.permissions = data.permissions;

  await roleRepo().save(role);

  const { logAudit } = await import("../../services/audit.service.js");
  await logAudit({
    organizationId,
    actorId: actorId || null,
    action: "role.updated",
    resource: "roles",
    resourceId: role.id,
    meta: { name: role.name },
  });

  return role;
}

export async function deleteRole(
  id: string,
  organizationId: string,
  actorId?: string
): Promise<void> {
  const role = await roleRepo().findOne({ where: { id, organizationId } });
  if (!role) throw new Error("Role not found");
  if (role.isSystem) throw new Error("Cannot delete system roles");

  const { logAudit } = await import("../../services/audit.service.js");
  await logAudit({
    organizationId,
    actorId: actorId || null,
    action: "role.deleted",
    resource: "roles",
    resourceId: role.id,
    meta: { name: role.name },
  });

  await roleRepo().delete({ id, organizationId });
}
