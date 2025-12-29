import type { CollectionConfig } from 'payload';
import { canManageContent } from '@/lib/access';

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    read: () => true,
    create: canManageContent,
    update: canManageContent,
    delete: canManageContent,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'order', 'updatedAt'],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          admin: {
            width: '50%',
          },
          label: 'Name',
          required: true,
        },
        {
          name: 'slug',
          type: 'text',
          admin: {
            width: '50%',
          },
          label: 'Slug',
          required: true,
          unique: true,
          index: true,
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
    },
    {
      name: 'order',
      type: 'number',
      label: 'Sort Order',
      defaultValue: 0,
      admin: {
        description: 'Lower numbers appear first',
      },
    },
    // Join field: shows all apps in this category
    {
      name: 'apps',
      type: 'join',
      collection: 'apps',
      defaultLimit: 20,
      label: 'Apps',
      on: 'category',
    },
  ],
  timestamps: true,
};
