import MenuCardDemo from '@/components/food/MenuCardDemo';
import Head from 'next/head';

export default function MenuDemoPage() {
  return (
    <>
      <Head>
        <title>Menu Cards Demo - Uber Eats Inspired | MenuCA</title>
        <meta name="description" content="Enhanced menu cards optimized for local businesses without professional photography" />
      </Head>
      <MenuCardDemo />
    </>
  );
}