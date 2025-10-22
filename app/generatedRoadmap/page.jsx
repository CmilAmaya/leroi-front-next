import GeneratedRoadmapClient from './GeneratedRoadmapClient';

export const metadata = {
  title: 'Roadmap Generado - Leroi',
  description: 'Tu roadmap personalizado generado por IA',
};

export default function GeneratedRoadmapPage({ searchParams }) {
  return (
    <div className="generated-roadmap-container">
      <GeneratedRoadmapClient searchParams={searchParams} />
    </div>
  );
}