/**
 * Utilitário de Processamento de Imagens da Taberna Digital
 * Remoção de Fundo Avançada com Limpeza de 'Ilhas Internas' e Defringing via Canvas:
 * 1. Fundo Quadriculado (Salas III e V):
 *    - Varredura global e remoção de pixels acromáticos de alta luminosidade (R,G,B > 190, max-min < 12)
 *      tanto externos quanto internos (ex: vão do lampião, laço do colar).
 *    - Erosão / feathering de 1px nas bordas para eliminar serrilhado branco em balcões e moedas.
 * 2. Fundo Preto Sólido (Salas I, II, IV):
 *    - Remoção do fundo externo e de todas as ilhas/vãos internos de preto puro (R,G,B < 18 com área > 15px),
 *      limpando vãos dos encostos e braços das cadeiras enquanto preserva o traço de nanquim.
 */

const cleanImageCache = new Map<string, string>();

export function cleanImageBackground(src: string): Promise<string> {
  // Retorna do cache se já processada
  if (cleanImageCache.has(src)) {
    return Promise.resolve(cleanImageCache.get(src)!);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        if (!width || !height) {
          resolve(src);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const totalPixels = width * height;

        // Funções auxiliares de cor
        const isPureBlack = (r: number, g: number, b: number) =>
          r < 18 && g < 18 && b < 18;

        const isAchromaticLight = (r: number, g: number, b: number) => {
          if (r <= 190 || g <= 190 || b <= 190) return false;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          return (max - min) < 12;
        };

        // 1. Amostrar o perímetro para detectar o tipo de fundo predominante
        let darkBorderCount = 0;
        let checkerBorderCount = 0;
        let totalBorderPixels = 0;

        for (let x = 0; x < width; x++) {
          const idxTop = x * 4;
          if (isPureBlack(data[idxTop], data[idxTop + 1], data[idxTop + 2])) darkBorderCount++;
          if (isAchromaticLight(data[idxTop], data[idxTop + 1], data[idxTop + 2])) checkerBorderCount++;

          const idxBot = ((height - 1) * width + x) * 4;
          if (isPureBlack(data[idxBot], data[idxBot + 1], data[idxBot + 2])) darkBorderCount++;
          if (isAchromaticLight(data[idxBot], data[idxBot + 1], data[idxBot + 2])) checkerBorderCount++;

          totalBorderPixels += 2;
        }

        for (let y = 1; y < height - 1; y++) {
          const idxLeft = (y * width) * 4;
          if (isPureBlack(data[idxLeft], data[idxLeft + 1], data[idxLeft + 2])) darkBorderCount++;
          if (isAchromaticLight(data[idxLeft], data[idxLeft + 1], data[idxLeft + 2])) checkerBorderCount++;

          const idxRight = (y * width + (width - 1)) * 4;
          if (isPureBlack(data[idxRight], data[idxRight + 1], data[idxRight + 2])) darkBorderCount++;
          if (isAchromaticLight(data[idxRight], data[idxRight + 1], data[idxRight + 2])) checkerBorderCount++;

          totalBorderPixels += 2;
        }

        const isDarkBackground = darkBorderCount > totalBorderPixels * 0.15;
        const isCheckerBackground = checkerBorderCount > totalBorderPixels * 0.15;

        // Se a imagem for uma pintura de cena completa sem fundos recortáveis, mantém intacta
        if (!isDarkBackground && !isCheckerBackground) {
          cleanImageCache.set(src, src);
          resolve(src);
          return;
        }

        // =========================================================================
        // CASO A: IMAGEM COM FUNDO QUADRICULADO FALSO (Salas III e V)
        // =========================================================================
        if (isCheckerBackground) {
          // 1. Varredura global: converter todos os blocos de xadrez branco/cinza em transparentes
          for (let i = 0; i < totalPixels; i++) {
            const dIdx = i * 4;
            const r = data[dIdx];
            const g = data[dIdx + 1];
            const b = data[dIdx + 2];

            if (isAchromaticLight(r, g, b)) {
              data[dIdx + 3] = 0; // alpha = 0
            }
          }

          // 2. Feathering / Erosão de 1px nas bordas para eliminar o serrilhado branco
          // Localiza pixels opacos adjacentes a pixels transparentes e remove ou suaviza resíduos claros
          const toClearEdge: number[] = [];

          for (let p = 0; p < totalPixels; p++) {
            const pIdx = p * 4;
            if (data[pIdx + 3] === 0) continue; // já é transparente

            const px = p % width;
            const py = (p / width) | 0;

            const hasTransparentNeighbor =
              (px > 0 && data[(p - 1) * 4 + 3] === 0) ||
              (px < width - 1 && data[(p + 1) * 4 + 3] === 0) ||
              (py > 0 && data[(p - width) * 4 + 3] === 0) ||
              (py < height - 1 && data[(p + width) * 4 + 3] === 0);

            if (hasTransparentNeighbor) {
              const r = data[pIdx];
              const g = data[pIdx + 1];
              const b = data[pIdx + 2];
              const max = Math.max(r, g, b);
              const min = Math.min(r, g, b);
              const brightness = (r + g + b) / 3;

              // Se o pixel de borda for claro e pouco saturado (halo residual de xadrez)
              if (brightness > 175 && (max - min) < 22) {
                toClearEdge.push(pIdx);
              } else if (brightness > 195) {
                toClearEdge.push(pIdx);
              }
            }
          }

          for (const idx of toClearEdge) {
            data[idx + 3] = 0;
          }
        }

        // =========================================================================
        // CASO B: IMAGEM COM FUNDO PRETO SÓLIDO (Salas I, II, IV)
        // =========================================================================
        if (isDarkBackground) {
          // Detectar componentes conectados de preto puro (R,G,B < 18)
          // Se o componente tocar as bordas OU tiver área conectada > 15 pixels: alpha = 0
          const visited = new Uint8Array(totalPixels);
          const queue = new Int32Array(totalPixels);

          for (let p = 0; p < totalPixels; p++) {
            if (visited[p] === 1) continue;

            const pIdx = p * 4;
            if (!isPureBlack(data[pIdx], data[pIdx + 1], data[pIdx + 2])) {
              visited[p] = 1;
              continue;
            }

            // Iniciar BFS para esta região escura
            let head = 0;
            let tail = 0;
            queue[tail++] = p;
            visited[p] = 1;

            const componentPixels: number[] = [];
            let touchesBorder = false;

            while (head < tail) {
              const curr = queue[head++];
              componentPixels.push(curr);

              const cx = curr % width;
              const cy = (curr / width) | 0;

              if (cx === 0 || cx === width - 1 || cy === 0 || cy === height - 1) {
                touchesBorder = true;
              }

              const neighbors = [
                cx > 0 ? curr - 1 : -1,
                cx < width - 1 ? curr + 1 : -1,
                cy > 0 ? curr - width : -1,
                cy < height - 1 ? curr + width : -1,
              ];

              for (let n = 0; n < 4; n++) {
                const next = neighbors[n];
                if (next !== -1 && visited[next] === 0) {
                  const nIdx = next * 4;
                  if (isPureBlack(data[nIdx], data[nIdx + 1], data[nIdx + 2])) {
                    visited[next] = 1;
                    queue[tail++] = next;
                  }
                }
              }
            }

            // Se tocar a borda OU se a ilha escura for maior que 10 pixels (vãos de cadeiras, braços, ramos florais)
            // OU se contiver preto puro #000000 com mais de 3 pixels
            const hasPureBlackPixel = componentPixels.some((pixel) => {
              const pIdx = pixel * 4;
              return data[pIdx] === 0 && data[pIdx + 1] === 0 && data[pIdx + 2] === 0;
            });

            if (touchesBorder || componentPixels.length > 10 || (hasPureBlackPixel && componentPixels.length > 3)) {
              for (const pixel of componentPixels) {
                data[pixel * 4 + 3] = 0;
              }
            }
          }

          // Defringing sutil de 1px nas bordas do preto (eliminar halos escuros)
          for (let p = 0; p < totalPixels; p++) {
            const pIdx = p * 4;
            if (data[pIdx + 3] === 0) continue;

            const px = p % width;
            const py = (p / width) | 0;

            const hasTransparentNeighbor =
              (px > 0 && data[(p - 1) * 4 + 3] === 0) ||
              (px < width - 1 && data[(p + 1) * 4 + 3] === 0) ||
              (py > 0 && data[(p - width) * 4 + 3] === 0) ||
              (py < height - 1 && data[(p + width) * 4 + 3] === 0);

            if (hasTransparentNeighbor) {
              const r = data[pIdx];
              const g = data[pIdx + 1];
              const b = data[pIdx + 2];
              // Se for um halo muito escuro na borda com a transparência
              if (r < 32 && g < 32 && b < 32) {
                data[pIdx + 3] = 0;
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const cleanedDataUrl = canvas.toDataURL('image/png');
        cleanImageCache.set(src, cleanedDataUrl);
        resolve(cleanedDataUrl);
      } catch (err) {
        console.warn('Erro ao limpar fundo da imagem com Canvas:', err);
        resolve(src);
      }
    };

    img.onerror = () => {
      resolve(src);
    };

    img.src = src;
  });
}
