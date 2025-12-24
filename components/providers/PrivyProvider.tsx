'use client';

import { PrivyProvider as Privy } from '@privy-io/react-auth';

export default function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <Privy
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#00D4AA',
          logo: '/favicon.svg',
        },
        loginMethods: ['email', 'wallet', 'google', 'twitter'],
      }}
    >
      {children}
    </Privy>
  );
}
