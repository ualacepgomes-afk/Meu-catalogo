const fs = require('fs');
const path = require('path');

// Certifique-se de que o nome da pasta aqui é EXATAMENTE igual ao da sua pasta no Windows
const PASTA_IMAGENS = './Immagens Camisas'; 
const ARQUIVO_SAIDA = './produtos.json';

function scan() {
    try {
        // Verifica se a pasta principal existe antes de começar
        if (!fs.existsSync(PASTA_IMAGENS)) {
            console.error(`❌ Erro: A pasta "${PASTA_IMAGENS}" não foi encontrada!`);
            return;
        }

        const listaProdutos = [];
        const times = fs.readdirSync(PASTA_IMAGENS);

        times.forEach(time => {
            const caminhoTime = path.join(PASTA_IMAGENS, time);
            
            // Só entra se for uma pasta (ignora arquivos soltos como o .DS_Store ou imagens fora de pastas)
            if (fs.lstatSync(caminhoTime).isDirectory()) {
                const arquivos = fs.readdirSync(caminhoTime);

                arquivos.forEach(arquivo => {
                    // Verifica se é imagem (jpg, png, webp, jpeg)
                    if (/\.(jpg|jpeg|png|webp)$/i.test(arquivo)) {
                        listaProdutos.push({
                            nome: `Camisa ${time} - ${arquivo.split('.')[0]}`,
                            descricao: `Modelo ${time} - Alta Qualidade`,
                            categoria: time,
                            imagens: [`Imagens Camisas/${time}/${arquivo}`]
                        });
                    }
                });
            }
        });

        fs.writeFileSync(ARQUIVO_SAIDA, JSON.stringify(listaProdutos, null, 2));
        console.log(`✅ Sucesso! ${listaProdutos.length} produtos foram catalogados.`);
        
    } catch (error) {
        console.error("❌ Ocorreu um erro inesperado:", error.message);
    }
}

scan();