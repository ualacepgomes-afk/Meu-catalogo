const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const URL_ALBUM = 'https://huang456852.x.yupoo.com/albums?page=1';
const PASTA_DESTINO = './Minhas_Imagens';

if (!fs.existsSync(PASTA_DESTINO)) fs.mkdirSync(PASTA_DESTINO, { recursive: true });

async function iniciarDownload() {
    console.log("🚀 Iniciando Modo de Captura Profunda...");
    const browser = await puppeteer.launch({ headless: false }); 
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    try {
        console.log(`🕵️ Acessando página principal: ${URL_ALBUM}`);
        await page.goto(URL_ALBUM, { waitUntil: 'networkidle2' });
        
        // Rola um pouco para garantir que o DOM carregue
        await page.evaluate(() => window.scrollBy(0, 800));
        await new Promise(r => setTimeout(r, 3000));

        // 1. CAPTURA TODOS OS LINKS DOS ÁLBUNS
        const linksProdutos = await page.evaluate(() => {
            const anchors = document.querySelectorAll('a[href*="/albums/"]');
            const uniqueLinks = [];
            const seen = new Set();

            anchors.forEach(a => {
                const href = a.href;
                // Busca o título dentro da estrutura do Yupoo
                const titulo = a.querySelector('.showalbum__children, .album__name')?.innerText?.trim() 
                               || a.title 
                               || "item_" + Math.random().toString(36).substr(2, 5);

                if (!seen.has(href)) {
                    seen.add(href);
                    uniqueLinks.push({ titulo, urlInterna: href });
                }
            });
            return uniqueLinks;
        });

        console.log(`📸 Encontrados ${linksProdutos.length} álbuns. Iniciando navegação individual...`);

        // 2. ENTRA EM CADA ÁLBUM PARA PEGAR A FOTO REAL
        for (let i = 0; i < linksProdutos.length; i++) {
            const item = linksProdutos[i];
            const nomeArquivo = `${item.titulo.replace(/[/\\?%*:|"<>]/g, '-')}.jpg`;
            const localPath = path.join(PASTA_DESTINO, nomeArquivo);

            // Pula se o arquivo já existir
            if (fs.existsSync(localPath)) {
                console.log(`[${i+1}/${linksProdutos.length}] ⏩ Já existe: ${nomeArquivo}`);
                continue;
            }

            try {
                const abaProduto = await browser.newPage();
                // Vai até a página interna do produto
                await abaProduto.goto(item.urlInterna, { waitUntil: 'networkidle2', timeout: 60000 });
                
                // Espera a imagem principal carregar na página interna
                await abaProduto.waitForSelector('.showalbum__children img', { timeout: 10000 });

                const imgUrl = await abaProduto.evaluate(() => {
                    const img = document.querySelector('.showalbum__children img');
                    return img?.src;
                });

                if (imgUrl && imgUrl.includes('http')) {
                    // Navega até a URL da imagem para pegar o buffer real
                    const viewSource = await abaProduto.goto(imgUrl, { waitUntil: 'networkidle2' });
                    fs.writeFileSync(localPath, await viewSource.buffer());
                    console.log(`[${i+1}/${linksProdutos.length}] ✅ Baixado: ${nomeArquivo}`);
                }

                await abaProduto.close();
                // Pequena pausa para o servidor não nos bloquear
                await new Promise(r => setTimeout(r, 1500)); 

            } catch (err) {
                console.error(`❌ Erro no item ${item.titulo}: ${err.message}`);
            }
        }

    } catch (e) {
        console.error("❌ Erro Geral:", e.message);
    } finally {
        console.log("🏁 Processo finalizado! Confira a pasta 'Minhas_Imagens'.");
        await browser.close();
    }
}

iniciarDownload();