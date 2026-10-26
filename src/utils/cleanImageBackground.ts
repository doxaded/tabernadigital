/**
 * Utilitário de Processamento de Imagens da Taberna Digital
 * Remove automaticamente fundos pretos sólidos (Sala I) e fundos quadriculados falsos (Salas III e V)
 * utilizando HTML5 Canvas e BFS flood-fill a partir das bordas da imagem.
 */

const cleanImageCache = new Map<string, string>();

export interface CleanImageOptions {
  darkThreshold?: number; // Limite para pixels pretos (default: 36)
  checkerThreshold?: number; // Limite de luminosidade para quadriculado (default: 190)
  maxColorDiff?: number; // Diferença máx entre R, G e B para cinza neutro (default: 15)
}

/**
 * Processa a imagem em um Canvas offscreen e retorna uma DataURL (PNG com transparência)
 * removendo o fundo preto ou o quadriculado falso conectado às bordas.
 */
export function cleanImageBackground(
  src: string,
  options: CleanImageOptions = {}
): Promise<string> {
  // Retorna do cache se já processada
  if (cleanImageCache.has(src)) {
    return Promise.resolve(cleanImageCache.get(src)!);
  }

  const darkThreshold = options.darkThreshold ?? 36;
  const checkerThreshold = options.checkerThreshold ?? 190;
  const maxColorDiff = options.maxColorDiff ?? 15;

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

        // Verificadores de cor
        const isDark = (r: number, g: number, b: number) =>
          r <= darkThreshold && g <= darkThreshold && b <= darkThreshold;

        const isChecker = (r: number, g: number, b: number) =>
          r >= checkerThreshold &&
          g >= checkerThreshold &&
          b >= checkerThreshold &&
          Math.abs(r - g) <= maxColorDiff &&
          Math.abs(r - b) <= maxColorDiff &&
          Math.abs(g - b) <= maxColorDiff;

        // 1. Amostrar o perímetro para detectar se a imagem possui fundo recortável
        let darkBorderCount = 0;
        let checkerBorderCount = 0;
        let totalBorderPixels = 0;

        for (let x = 0; x < width; x++) {
          // Borda superior
          const idxTop = x * 4;
          if (isDark(data[idxTop], data[idxTop + 1], data[idxTop + 2])) darkBorderCount++;
          if (isChecker(data[idxTop], data[idxTop + 1], data[idxTop + 2])) checkerBorderCount++;

          // Borda inferior
          const idxBot = ((height - 1) * width + x) * 4;
          if (isDark(data[idxBot], data[idxBot + 1], data[idxBot + 2])) darkBorderCount++;
          if (isChecker(data[idxBot], data[idxBot + 1], data[idxBot + 2])) checkerBorderCount++;

          totalBorderPixels += 2;
        }

        for (let y = 1; y < height - 1; y++) {
          // Borda esquerda
          const idxLeft = (y * width) * 4;
          if (isDark(data[idxLeft], data[idxLeft + 1], data[idxLeft + 2])) darkBorderCount++;
          if (isChecker(data[idxLeft], data[idxLeft + 1], data[idxLeft + 2])) checkerBorderCount++;

          // Borda direita
          const idxRight = (y * width + (width - 1)) * 4;
          if (isDark(data[idxRight], data[idxRight + 1], data[idxRight + 2])) darkBorderCount++;
          if (isChecker(data[idxRight], data[idxRight + 1], data[idxRight + 2])) checkerBorderCount++;

          totalBorderPixels += 2;
        }

        const isDarkBackground = darkBorderCount > totalBorderPixels * 0.2;
        const isCheckerBackground = checkerBorderCount > totalBorderPixels * 0.2;

        // Se a imagem não tem fundo preto nem quadriculado na borda (ex: pintura renascentista cheia),
        // preserva a imagem intacta.
        if (!isDarkBackground && !isCheckerBackground) {
          cleanImageCache.set(src, src);
          resolve(src);
          return;
        }

        // 2. BFS Flood-Fill para remover apenas pixels de fundo conectados às bordas
        const isBgPixel = isDarkBackground
          ? (r: number, g: number, b: number) => isDark(r, g, b)
          : (r: number, g: number, b: number) => isChecker(r, g, b);

        const visited = new Uint8Array(totalPixels);
        const queue = new Int32Array(totalPixels);
        let head = 0;
        let tail = 0;

        // Função para enfileirar pixel de borda se for fundo
        const tryEnqueueBorder = (x: number, y: number) => {
          const pixelIndex = y * width + x;
          if (visited[pixelIndex] === 0) {
            const dataIdx = pixelIndex * 4;
            if (isBgPixel(data[dataIdx], data[dataIdx + 1], data[dataIdx + 2])) {
              visited[pixelIndex] = 1;
              queue[tail++] = pixelIndex;
            }
          }
        };

        // Adicionar todas as bordas
        for (let x = 0; x < width; x++) {
          tryEnqueueBorder(x, 0);
          tryEnqueueBorder(x, height - 1);
        }
        for (let y = 1; y < height - 1; y++) {
          tryEnqueueBorder(0, y);
          tryEnqueueBorder(width - 1, y);
        }

        // Executar BFS
        while (head < tail) {
          const curr = queue[head++];
          const cx = curr % width;
          const cy = (curr / width) | 0;

          // Tornar pixel transparente (alpha = 0)
          const dataIdx = curr * 4;
          data[dataIdx + 3] = 0;

          // Vizinhos 4-conectados
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
              if (isBgPixel(data[nIdx], data[nIdx + 1], data[nIdx + 2])) {
                visited[next] = 1;
                queue[tail++] = next;
              }
            }
          }
        }

        // 3. Suavização sutil de borda (Defringe) para eliminar resíduos em volta da arte
        if (isDarkBackground) {
          // Para fundo preto: se um pixel vizinho a um transparente for quase preto (r,g,b <= 50), zera também
          for (let p = 0; p < totalPixels; p++) {
            if (visited[p] === 1) {
              const px = p % width;
              const py = (p / width) | 0;
              const checkNeighbors = [
                px > 0 ? p - 1 : -1,
                px < width - 1 ? p + 1 : -1,
                py > 0 ? p - width : -1,
                py < height - 1 ? p + width : -1,
              ];
              for (let k = 0; k < 4; k++) {
                const adj = checkNeighbors[k];
                if (adj !== -1 && visited[adj] === 0) {
                  const aIdx = adj * 4;
                  if (data[aIdx] < 50 && data[aIdx + 1] < 50 && data[aIdx + 2] < 50) {
                    data[aIdx + 3] = 0;
                  }
                }
              }
            }
          }
        } else if (isCheckerBackground) {
          // Para quadriculado: se um pixel vizinho a um transparente for cinza claro residual (r,g,b >= 180 e neutro), zera também
          for (let p = 0; p < totalPixels; p++) {
            if (visited[p] === 1) {
              const px = p % width;
              const py = (p / width) | 0;
              const checkNeighbors = [
                px > 0 ? p - 1 : -1,
                px < width - 1 ? p + 1 : -1,
                py > 0 ? p - width : -1,
                py < height - 1 ? p + width : -1,
              ];
              for (let k = 0; k < 4; k++) {
                const adj = checkNeighbors[k];
                if (adj !== -1 && visited[adj] === 0) {
                  const aIdx = adj * 4;
                  const r = data[aIdx];
                  const g = data[aIdx + 1];
                  const b = data[aIdx + 2];
                  if (
                    r >= 180 &&
                    g >= 180 &&
                    b >= 180 &&
                    Math.abs(r - g) <= 16 &&
                    Math.abs(r - b) <= 16 &&
                    Math.abs(g - b) <= 16
                  ) {
                    data[aIdx + 3] = 0;
                  }
                }
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
