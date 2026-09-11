import React from 'react';

/**
 * Fundo global. Preto puro com duas camadas quase imperceptíveis: scanlines
 * de CRT e um halo magenta muito baixo, na altura do horizonte.
 *
 * Substituiu a cena synthwave completa (nebulosa + campo de estrelas + grade
 * animada + grão). Aquilo competia com o conteúdo em todas as páginas; a
 * malha em perspectiva agora aparece uma vez só, no herói da Home.
 */
export const Backdrop: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none bg-black">
    <div
      className="absolute inset-x-0 bottom-0 h-1/2"
      style={{
        background:
          'radial-gradient(ellipse 90% 100% at 50% 100%, rgba(255, 46, 151, 0.055) 0%, transparent 70%)',
      }}
    />
    <div className="sw-scan absolute inset-0" />
  </div>
);
