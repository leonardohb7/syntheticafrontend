'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SplashScreen } from '@/components/splash/SplashScreen';
import { Backdrop } from '@/components/common/Backdrop';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Moldura comum das cinco rotas: o que era o corpo do App.tsx com BrowserRouter.
 *
 * Existe como componente separado porque o layout.tsx precisa continuar Server
 * Component para exportar metadata, e splash, Header e Backdrop dependem de
 * estado e de hooks de navegação. Como o AppShell não remonta entre rotas, a
 * abertura continua aparecendo uma vez por carga de página, não a cada clique.
 */
export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      <div className="min-h-screen bg-black text-ink relative overflow-x-hidden">
        <div className="fixed inset-0 pointer-events-none z-0">
          <Backdrop />
        </div>

        <Header />

        <main className="relative z-10">{children}</main>

        <Footer />
      </div>
    </>
  );
};
