import type { Project } from '@/content/projects/schemas';

export const synapseOmsProject: Project = {
  id: 'synapse-oms',
  title: 'SynapseOMS',
  summary:
    'Self-hosted order management system for traders working across equities and crypto. Four-service distributed architecture connected by Kafka, with sub-10 ms gRPC pre-trade risk checks and ML-scored venue selection.',
  role: 'Author, architect, sole contributor.',
  problem:
    'Hosted OMS platforms put credentials, order flow, and risk telemetry on someone else\'s machine. Independent traders who want serious risk gating and venue analytics have to either pay institutional pricing or accept that their entire blotter lives on a vendor\'s servers.',
  approach:
    'Four services on the trader\'s laptop: a Go gateway accepting orders, a Python risk engine running VaR / concentration / Greeks checks at gRPC sub-10 ms, a Python ML scorer choosing venues via XGBoost, and a React dashboard for blotter + analytics. Kafka wires them together, Postgres + Redis back state, pluggable adapters connect to Alpaca and Binance, and Claude analyses fills after the fact. Credentials sit at rest under Argon2id + AES-256-GCM — nothing leaves the box.',
  stack: [
    'Go',
    'Python',
    'React',
    'TypeScript',
    'Kafka',
    'PostgreSQL',
    'Redis',
    'gRPC',
    'XGBoost',
    'Docker',
  ],
  outcome:
    'Pre-trade risk checks under 10 ms p99, ML venue scoring with XGBoost, real-time WebSocket blotter, AI-driven post-trade analysis. End-to-end self-hosted — no third-party state, no vendor lock-in.',
  screenshots: [],
  links: [
    {
      label: 'Source on GitHub',
      href: 'https://github.com/essandhu/SynapseOMS',
    },
  ],
  visibility: 'public',
  spine: {
    color: '#1d2a3a',
    material: 'paper',
    accent: false,
  },
};
