import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import clsx from 'clsx';
import styles from './styles.module.css';
import { ReactNode } from 'react';

type FeatureItem = {
  title: string;
  description: ReactNode;
  link: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Abstraction',
    description: (
      <>
        <strong>VM-X</strong> introduces an abstraction layer between your code
        and your AI inference providers. Not only does this allow you to easily
        swap one model for another, it also allows you to easily switch between
        providers.
      </>
    ),
    link: '/docs/intro',
  },
  // {
  //   title: 'Fallback',
  //   description: (
  //     <>
  //       <strong>Reduce error rates.</strong> Some model calls are too critical
  //       to fail. With <strong>VM-X</strong>, define a resource which is always
  //       available by providing a fall back model. This second resource will
  //       respond if the first call fails.
  //     </>
  //   ),
  //   link: '/docs/cloud-console/ai-resources/fallback',
  // },
  // {
  //   title: 'Dynamic Routing',
  //   description: (
  //     <>
  //       <strong>VM-X</strong> dynamic routing is fully configurable. Developers
  //       don't like black boxes. We let you define which rules to use and when.
  //     </>
  //   ),
  //   link: '/docs/cloud-console/ai-resources/dynamic-routing',
  // },
  // {
  //   title: 'Resource and Capacity Allocation',
  //   description: (
  //     <>
  //       We understand that some requests are more important than others. We also
  //       know that resource prioritization across many applications gets
  //       complicated very quickly.
  //     </>
  //   ),
  //   link: '/docs/cloud-console/prioritization/concept',
  // },
];

function Feature({ title, link, description }: FeatureItem) {
  return (
    <div className={clsx('col card margin-horiz--sm')}>
      <div className="text--center padding-horiz--md card__header">
        <Heading as="h3">{title}</Heading>
      </div>
      <div className="text--center padding-horiz--md card__body">
        <p>{description}</p>
      </div>
      <div className="text--center card__footer">
        <Link
          className="button button--block button--outline button--primary button--md"
          to={link}
        >
          Read more
        </Link>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
