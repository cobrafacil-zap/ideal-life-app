# Gerador de Imagens de Super-Heróis

Script Python para gerar imagens de crianças com super-heróis usando os prompts do PDF "Pack_50_Personagens_IA_PT_COM_ROSTOS_PESSOA".

## Requisitos

- Python 3.7+
- Conta na OpenAI com API key
- Dados suficientes na conta OpenAI (cada imagem DALL-E 3 custa ~$0.04)

## Instalação

```bash
pip install -r requirements-superhero.txt
```

## Configuração

### Opção 1: Variável de ambiente (recomendado)

```bash
export OPENAI_API_KEY=sua_chave_aqui
```

### Opção 2: Argumento de linha de comando

```bash
python generate_superhero_images.py --api-key sua_chave_aqui
```

## Uso

### Gerar todas as 50 imagens

```bash
python generate_superhero_images.py
```

### Gerar apenas algumas imagens (para testes)

```bash
python generate_superhero_images.py --limite 3
```

### Especificar pasta de saída personalizada

```bash
python generate_superhero_images.py --output-dir ./minhas_imagens
```

### Usar tamanho de imagem diferente

```bash
python generate_superhero_images.py --tamanho 512x512
```

## Opções

| Opção | Descrição | Padrão |
|-------|-----------|--------|
| `--pdf` | Caminho para o PDF | `/Users/pcs/Downloads/Pack_50_Personagens_IA_PT_COM_ROSTOS_PESSOA (1).pdf` |
| `--output-dir` | Pasta de saída | `./superherois` |
| `--api-key` | API key da OpenAI | Variável de ambiente `OPENAI_API_KEY` |
| `--tamanho` | Tamanho das imagens | `1024x1024` |
| `--limite` | Limitar número de imagens | Sem limite |

## Saída

- **Imagens**: Arquivos PNG nomeados como `01_homem_aranha.png`, `02_batman.png`, etc.
- **Resumo**: Arquivo `resumo.json` com detalhes de cada imagem gerada

## Personagens incluídos

1. Homem-Aranha
2. Batman
3. Super-Homem
4. Homem de Ferro
5. Capitão América
6. Thor
7. Hulk
8. Pantera Negra
9. Flash
10. Mulher-Maravilha
11. Aquaman
12. Lanterna Verde
13. Wolverine
14. Deadpool
15. Doutor Estranho
16. Feiticeira Escarlate
17. Viúva Negra
18. Gavião Arqueiro
19. Senhor das Estrelas
20. Capitã Marvel
21. Shazam
22. Besouro Azul
23. Ciborgue
24. Robin
25. Asa Noturna
26. Demolidor
27. Cavaleiro da Lua
28. Loki
29. Gamora
30. Nebulosa
31. Homem-Formiga
32. Vespa
33. Visão
34. Falcão
35. Soldado Invernal
36. Supergirl
37. Batgirl
38. Mulher-Gato
39. Arqueiro Verde
40. Ahsoka Tano
41. Darth Vader
42. Luke Skywalker
43. Harry Potter
44. Hermione Granger
45. Pikachu
46. Goku
47. Vegeta
48. Naruto
49. Sonic
50. Miles Morales

## Custo estimado

- DALL-E 3 (1024x1024, qualidade padrão): ~$0.04 por imagem
- Total para 50 imagens: ~$2.00

## Notas

- Os prompts do PDF são em inglês e foram projetados para preservar a identidade facial de uma criança
- As imagens geradas são originais e não reproduzem exatamente os personagens dos quadrinhos/filmes
- Verifique os termos de uso da OpenAI antes de usar as imagens comercialmente
