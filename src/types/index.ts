// Types for the Awesome Mac Navigator Engine

// Export API types
export * from './api';

export interface AppIcon {
  type: 'oss' | 'freeware' | 'app-store' | 'awesome-list';
  url: string;
}

export interface AppMark {
  title: string;
  url: string;
  icons: AppIcon[];
  delete?: boolean;
}

export interface AppItem {
  type: 'listItem';
  children: AppParagraph[];
}

export interface AppParagraph {
  type: 'paragraph';
  children: (TextNode | LinkNode)[];
  mark: AppMark;
}

export interface TextNode {
  type: 'text';
  value: string;
}

export interface LinkNode {
  type: 'link';
  title: string | null;
  url: string;
  children: TextNode[];
}

export interface CategoryHeading {
  type: 'heading';
  depth: 2 | 3;
  value: string;
}

export interface CategoryList {
  type: 'list';
  ordered: boolean;
  start: number | null;
  spread: boolean;
  children: AppItem[];
}

export interface CategoryDescription {
  type: 'paragraph';
  children: {
    type: 'emphasis' | 'text';
    children?: TextNode[];
    value?: string;
  }[];
}

export type ASTNode = CategoryHeading | CategoryList | CategoryDescription | AppItem;

// Processed types for the UI
export interface App {
  id: string;
  slug: string;
  name: string;
  description: string;
  url: string;
  isFree: boolean;
  isOpenSource: boolean;
  isAppStore: boolean;
  hasAwesomeList: boolean;
  ossUrl?: string;
  appStoreUrl?: string;
  awesomeListUrl?: string;
  categoryId: string;
  categoryName: string;
  parentCategoryId?: string;
  parentCategoryName?: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  depth: 2 | 3;
  parentId?: string;
  parentName?: string;
  apps: App[];
  subcategories?: Category[];
}

export interface ParsedData {
  categories: Category[];
  apps: App[];
  categoryMap: Map<string, Category>;
  appMap: Map<string, App>;
}
