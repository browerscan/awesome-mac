import { buildConfig } from 'payload';
import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { fileURLToPath } from 'url';
import { collections } from './collections';
import {
  canCreateFirstUser,
  canManageContent,
  isAdmin,
  isAuthenticated,
  readSelfOrAdmin,
  updateSelfOrAdmin,
} from '@/lib/access';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  // Admin panel configuration
  admin: {
    user: 'users',
    meta: {
      titleSuffix: '- Awesome Mac Navigator',
    },
    components: {
      // Custom admin components can be added here
    },
  },

  // Collections
  collections: [
    ...collections,
    // Users collection for admin access
    {
      slug: 'users',
      auth: true,
      access: {
        create: canCreateFirstUser,
        delete: isAdmin,
        read: readSelfOrAdmin,
        update: updateSelfOrAdmin,
      },
      admin: {
        useAsTitle: 'email',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'role',
          type: 'select',
          options: [
            { label: 'Admin', value: 'admin' },
            { label: 'Editor', value: 'editor' },
          ],
          defaultValue: 'editor',
          required: true,
        },
      ],
    },
    // Media collection for app icons
    {
      slug: 'media',
      access: {
        create: isAuthenticated,
        delete: canManageContent,
        read: () => true,
        update: canManageContent,
      },
      upload: {
        staticDir: path.resolve(dirname, '../public/media'),
        mimeTypes: ['image/*'],
        imageSizes: [
          {
            name: 'thumbnail',
            width: 64,
            height: 64,
            position: 'centre',
          },
          {
            name: 'card',
            width: 128,
            height: 128,
            position: 'centre',
          },
          {
            name: 'large',
            width: 256,
            height: 256,
            position: 'centre',
          },
        ],
      },
      fields: [
        {
          name: 'alt',
          type: 'text',
          required: true,
        },
      ],
    },
  ],

  // Database configuration
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || 'file:./data/payload.db',
    },
  }),

  // Rich text editor
  editor: lexicalEditor({}),

  // Secret for authentication
  secret: (() => {
    const secret = process.env.PAYLOAD_SECRET;
    const isProduction = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';

    // Production: must have a valid secret
    if (isProduction && !secret) {
      throw new Error(
        'PAYLOAD_SECRET environment variable must be set in production. Generate one with: openssl rand -base64 32'
      );
    }

    // Production: must be at least 32 characters
    if (isProduction && secret && secret.length < 32) {
      throw new Error(
        'PAYLOAD_SECRET must be at least 32 characters long. Generate one with: openssl rand -base64 32'
      );
    }

    // Test: use a test secret
    if (isTest) {
      return 'test-secret-key-for-testing-environment-at-least-32-chars';
    }

    // Development: warn but use default
    if (!secret) {
      // eslint-disable-next-line no-console
      console.warn(
        '[Payload] WARNING: Using default PAYLOAD_SECRET for development. Set PAYLOAD_SECRET environment variable for better security.'
      );
      return 'dev-only-super-secret-payload-key-at-least-32-chars';
    }

    return secret;
  })(),

  // TypeScript output
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // GraphQL configuration
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql'),
  },
});
