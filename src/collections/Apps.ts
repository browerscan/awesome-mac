import type { CollectionConfig, FieldHook } from 'payload';
import { canManageContent } from '@/lib/access';

/**
 * Format string to URL-friendly slug
 */
const formatSlug = (val: string): string =>
  val
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .toLowerCase();

/**
 * Hook to auto-generate slug from name field
 */
const generateSlug: FieldHook = ({ data, operation, originalDoc, value }) => {
  // If slug is manually provided, format and use it
  if (typeof value === 'string' && value.trim()) {
    return formatSlug(value);
  }

  // On create or update, auto-generate from name field
  if (operation === 'create' || operation === 'update') {
    const nameValue = data?.name || originalDoc?.name;

    if (nameValue && typeof nameValue === 'string') {
      return formatSlug(nameValue);
    }
  }

  return value;
};

/**
 * Validate URL format
 */
const validateUrl = (value: string | null | undefined): true | string => {
  if (!value) return true;

  try {
    new URL(value);
    return true;
  } catch {
    return 'Please enter a valid URL (e.g., https://example.com)';
  }
};

export const Apps: CollectionConfig = {
  slug: 'apps',
  access: {
    read: () => true,
    create: canManageContent,
    update: canManageContent,
    delete: canManageContent,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'isFree', 'isOpenSource', 'updatedAt'],
  },
  fields: [
    // Name and Slug
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          admin: {
            width: '50%',
          },
          label: 'App Name',
          required: true,
          index: true,
        },
        {
          name: 'slug',
          type: 'text',
          admin: {
            width: '50%',
            description: 'Auto-generated from name if left empty',
          },
          label: 'Slug',
          required: true,
          unique: true,
          index: true,
          hooks: {
            beforeValidate: [generateSlug],
          },
        },
      ],
    },
    // URL (used as upsert key)
    {
      name: 'url',
      type: 'text',
      label: 'App URL',
      required: true,
      unique: true,
      index: true,
      validate: validateUrl,
      admin: {
        description: 'Primary URL for the app (used as unique identifier for upsert)',
      },
    },
    // Description
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
    },
    // Category relationship
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      label: 'Category',
      admin: {
        position: 'sidebar',
      },
    },
    // Flags row
    {
      type: 'row',
      fields: [
        {
          name: 'isFree',
          type: 'checkbox',
          label: 'Free',
          defaultValue: false,
          admin: {
            width: '33%',
            description: 'App is free to use',
          },
        },
        {
          name: 'isOpenSource',
          type: 'checkbox',
          label: 'Open Source',
          defaultValue: false,
          admin: {
            width: '33%',
            description: 'App is open source',
          },
        },
        {
          name: 'hasAppStore',
          type: 'checkbox',
          label: 'App Store',
          defaultValue: false,
          admin: {
            width: '33%',
            description: 'Available on Mac App Store',
          },
        },
      ],
    },
    // GitHub URL (optional, for open source apps)
    {
      name: 'githubUrl',
      type: 'text',
      label: 'GitHub URL',
      validate: validateUrl,
      admin: {
        condition: (data) => data?.isOpenSource,
        description: 'GitHub repository URL (for open source apps)',
      },
    },
    // Icon URL
    {
      name: 'iconUrl',
      type: 'text',
      label: 'Icon URL',
      validate: validateUrl,
      admin: {
        position: 'sidebar',
        description: 'URL to the app icon image',
      },
    },
  ],
  timestamps: true,
};
