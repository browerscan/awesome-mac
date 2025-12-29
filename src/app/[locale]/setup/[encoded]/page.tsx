import { notFound } from 'next/navigation';
import { getAllApps } from '@/lib/data';
import { SetupClient } from './SetupClient.tsx';
import { Metadata } from 'next';

export const revalidate = 3600;

interface SetupPageProps {
  params: Promise<{
    locale: string;
    encoded: string;
  }>;
}

export async function generateMetadata({ params }: SetupPageProps): Promise<Metadata> {
  const { encoded } = await params;

  try {
    const setupData = JSON.parse(atob(encoded));
    return {
      title: `${setupData.name || 'My Mac Setup'} - Awesome Mac`,
      description: `Check out this Mac setup with ${setupData.apps?.length || 0} apps!`,
    };
  } catch {
    return {
      title: 'Invalid Setup - Awesome Mac',
    };
  }
}

export default async function SetupPage({ params }: SetupPageProps) {
  const { locale, encoded } = await params;
  const apps = await getAllApps();

  let setupData: {
    name?: string;
    apps?: string[];
    createdAt?: string;
  } = {};

  try {
    setupData = JSON.parse(atob(encoded));

    if (!setupData.apps || !Array.isArray(setupData.apps)) {
      throw new Error('Invalid setup data');
    }
  } catch (error) {
    notFound();
  }

  // Get the actual app objects
  const setupApps = apps.filter((app) => setupData.apps?.includes(app.slug));

  return <SetupClient setupData={setupData} apps={setupApps} locale={locale} />;
}
